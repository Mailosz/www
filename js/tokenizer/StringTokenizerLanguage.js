export class StringTokenizerLanguageService {

	static #cache = {}; 
	/**
	 * Options used to parse a language if it isn't cached
	 */
	static parseOptions = {stricterParse: false}
	
	/**
	 * 
	 * @param {String} src 
	 * @param {String?} identifier Optional identifier of a language (if the same identifier is used twice then cached language is returned), if none specified then the src is taken as one
	 */
	static async getLanguageAsync(src, identifier) {
		if (!identifier) identifier = src;

		/**
		 * @type {Promise}
		 */
		try {
			const promise = StringTokenizerLanguageService.#cache[identifier];
			if (promise) {
				return promise;
			}
		} catch(ex) {
			console.error(ex);
		}

		console.log("Cache miss")

		const promise = fetch(src).then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				throw response.status + ": " + response.statusText;
			}

		}).then((json) =>{
			console.time("Language parse");
			const lang = new StringTokenizerLanguage(json, StringTokenizerLanguageService.parseOptions);
			console.timeEnd("Language parse");

			return lang;
		});

		StringTokenizerLanguageService.#cache[identifier] = promise;

		return await promise;
	}
}

export class StringTokenizerLanguage {

	constructor(languageJson, options){
		let nvl = (val, defaultVal) => {
			if (typeof(val) === "undefined") {
				return defaultVal;
			} else {
				return val;
			}
		};
		this.functionsAllowed = nvl(options?.allowFunctions, false);
		this.stricterParse = nvl(options?.stricterParse, false);

		this.#prepare(languageJson);
	}

	/**
	 * Parses given language
	 * @param {*} language 
	 */
	#prepare(language){

		this.states = [];
		this.defaultState = null;

		//get all state names, and default state
		for (const name in language){
			if (this.states[name] !== undefined){
				throw "Duplicate state name: " + name;
			}

			//is default
			const isDefault = language[name].default;
			if (isDefault !== undefined){
				if (isDefault === true){
					if (this.defaultState === null) {
						this.defaultState = name;
					} else {
						throw `More than one state set as default (first "${this.defaultState}", second: "${name}")`;
					}
				}
			}

			//definition
			this.states[name] = {name: name, 
				children: [],
				groupChildren: [],
				groups: [], 
				watchFor: [],
				data: {},
				vars: {},
				afters: [],
				computed: null};

			if (this.stricterParse) {
				const allowedStateProperties = ["init", "begin", "set", "after", "default", "data", "group", "parent"];
				for (const property in language[name]) {
					if (!allowedStateProperties.includes(property)) {
						throw `Unallowed property "${property}" in state "${name}"`;
					}
				}
			}
		}

		// set first state as default, if no one yet set
		if (this.defaultState === null) {
			this.defaultState = Object.keys(this.states)[0];

			console.warn("No state set as default, using the first one, " + this.defaultState)
		}

		// compute allowed values (set in a default state)
		this.defaultValues = {};
		if ("init" in language[this.defaultState]) {
			this.defaultValues = language[this.defaultState].init;
		} else if ("set" in language[this.defaultState]) {
			this.defaultValues = language[this.defaultState].set;
		}

		if (this.stricterParse) {
			for (const variable in this.defaultValues) {
				if (variable.indexOf("@") != -1) {
					throw `Variable names cannot contain '@' (variable "${variable}")`;
				}
			}
		}


		//prepare state definitions
		for (const name in language){
			//parents
			const parentName = language[name].parent;
			if (parentName !== undefined){
				if (Array.isArray){
					throw "Parent value cannot be an array";
				}
				const parentState = this.states[parentName];
				if (parentState === undefined){
					throw "No state named " + parentName + " (occured in a 'parent' on " + name + ")";
				}
				this.states[name].parent = parentState;
				parentState.children.push(this.states[name]);
			}

			//groups
			const group = language[name].group;
			if (group !== undefined){
				const groupNames = arrayize(group);
				const groupStates = [];
				for (let groupName of groupNames){
					if (groupName == name) {
						throw "State cannot have itself as a group (occured in a 'group' on " + name + ")";
					}
					const groupState = this.states[groupName];
					if (groupState === undefined){
						throw "No state named " + groupName + " (occured in a 'group' on " + name + ")";
					}
					groupStates.push(groupState);
					groupState.groupChildren.push(this.states[name]);
				}
				this.states[name].groups = groupStates;
				
			}

			//appending states' data
			const data = language[name].data;
			if (data !== undefined){
				this.states[name].data = data;
			}

			//setting variables
			this.states[name].setters = parseSetters(language[name].set, this.defaultValues, name);
		}

		// compute groups
		for (const stateName in this.states){
			const state = this.states[stateName];
			state.computed = this.#computeGroups(state, []);
		}


		const watchForEverywhere = [];
		//compute begins and afters for every state
		for (const name in language){

			//where the state starts
			const begin = language[name].begin;
			if (begin !== undefined){
				forElementOrArray(begin, (begin) => {
					
					const conditions = parseWhenConditions(begin.when, this.defaultValues, name);

					let matchers;
					if (begin.by !== undefined) {
						matchers = parseBeginMatchers(begin.by, (conditions.length>0?0.1:0), name);
					} else {
						if (begin.on === undefined) {
							throw "Cannot have begin without any of 'on' or 'by'  (state \"" + name + "\")";
						}
						// match everything matcher
						matchers = [emptyMatcher()];
					}

					let data = {};
					if (begin.data !== undefined) {
						data = begin.data;
					}

					const setters = parseSetters(begin.set, this.defaultValues, name);

					let importance;
					if (begin.importance !== undefined) {
						importance = begin.importance;
					} else {
						importance = 0;
					}

					// apply values to matchers
					for (const matcher of matchers){
						matcher.conditions = conditions;
						matcher.data = data;
						matcher.setters = setters;
						matcher.importance = importance;
						matcher.target = name;
					}

					if (begin.on !== undefined) {
						const where = [];
						const names = arrayize(begin.on);
		
						for (const n of names) {
							if (this.states[n] === undefined){
								throw "No such state: " + n + " (state \"" + name + "\")";
							}
							where.push(this.states[n]);
							
							for (const child of this.states[n].children){
								where.push(child);
							}
				
							for (const child of this.states[n].groupChildren){
								where.push(child);
							}
						}

						for (const whereState of where) {
							for (const matcher of matchers) {
								const ind = findSameMatcherIndex(whereState.watchFor, matcher);
								if (ind >= 0) {//duplicate
									throw "Duplicate change (by: \"" + JSON.stringify(matcher) + "\", on: \"" + whereState.name + "\") in state " + matcher.target;
	
									whereState.watchFor[ind].importance = Math.max(whereState.watchFor[ind].importance, watch.importance);
									whereState.watchFor[ind].data = {...whereState.watchFor[ind].data, ...watch.data};
								} else {
									whereState.watchFor.push(matcher);
								}
							}
						}
					} else {
						if (begin.everywhere === true) {
							watchForEverywhere.push(...matchers);
						} else {
							throw "A begin without 'on' value must have \"'everywhere': true\" set (state \"" + name + "\")";
						}
					}

				});
			}

			//setting after
			const afterDefinition = language[name].after;
			if (afterDefinition !== undefined) {
				forElementOrArray(afterDefinition, (after) => { 

					let conditions = parseWhenConditions(afterDefinition.when, this.defaultValues, name);

					let matchers;
					if (after.by !== undefined) {
						matchers = parseAfterMatchers(after.by,(conditions.length>0?0.1:0), name);
					} else {
						matchers = [emptyMatcher((conditions.length>0?-1:-2))];
					}
					
					
					//setting variables
					const setters = parseSetters(after.set, this.defaultValues, name);

					let data = {};
					if (after.data !== undefined) {
						data = after.data;
					}

					for (const matcher of matchers) {
						matcher.setters = setters;
						matcher.data = data;
						matcher.conditions = conditions;
						this.states[name].afters.push(matcher);
					}
					
				});
			}

		}



		//checking
		for (const stateName in this.states){
			const state = this.states[stateName];


			// add watches for every state
			for (const watch of watchForEverywhere) {
				if (watch.target == stateName) { //except if this is rule for current state
					continue;
				}

				const ind = findSameMatcherIndex(state.watchFor, watch);
				if (ind >= 0) {//duplicate
					if (watch.importance > state.watchFor[ind].importance) {
						console.info("'Everywhere' begin for state '" + watch.target + "' on state overrided explicit one for state '" + state.name + "' because of higher importance");

						state.watchFor.splice(ind, 1);
						state.watchFor.push(watch);
					}
				} else {
					state.watchFor.push(watch);
				}
			}


			if (state.watchFor.length == 0){
				console.warn("State " + stateName + " has no way out and is not final");
			} else {

				//sorting watchFors by importance and length
				state.watchFor.sort(matcherSort);
			}
		}
	}

	#computeGroups(state, history){

		if (history.indexOf(state.name) >= 0){
			throw "Cycle detected in groups of " + state.name;
		}

		if (state.computed !== null) {
			return state.computed;
		} else {
			state.computed = {data: state.data, then: state.then};

			if (state.groups.length == 0){
				return state.computed;
			} else {
				let nh = [...history, state.name];
				for (const group of state.groups) {
					let from = this.#computeGroups(group, nh);
					state.computed.data = {...from.data, ...state.computed.data};
					state.computed.then = {...from.then, ...state.computed.then};
				}
				return state.computed;
			}
		}
		
		
	}
}

/**
 * Returns the index of a matching state begin (same target and by values)
 * @param {*} list 
 * @param {*} watch 
 * @returns 
 */
function findSameMatcherIndex(list, a) { // TODO: better comparison
	const index = list.findIndex((b) => a.comparator === b.comparator
	&& a.target == b.target 
	&& a.conditions == b.conditions)
	if (index != -1) {
			console.log("Found same matchers: ", a, list[index]);
		return index;
	} else {
		return -1;		
	}
}

function matcherSort(a, b) {
	const impdif = b.importance - a.importance;
	if (impdif == 0){
		return b.order - a.order;
	} else {
		return impdif;
	}
}

function emptyMatcher(baseOrder) {
	return {match: () => 0, comparator: "", order: baseOrder, importance: 0};
}

function parseBeginMatchers(bys, baseOrder, stateName) {
	const matchers = [];
	forElementOrArray(bys, (by) => {

		const matcher = {minLength: by.length};

		if (typeof by == "object") {
			if ("text" in by) {
				matcher.match = function (text, pos) {
					return text.startsWith(by.text, pos) ? matcher.text.length : -1;
				}
				matcher.comparator = "text:" + by.text;
				matcher.order = by.text.length + baseOrder;
				if ("regex" in by) {
					throw `Cannot set both "text" and "regex" in a single matcher (text = "${by.text}", regex = "${by.regex}", "begin.by" in state ${stateName})`;
				}
			} else if ("regex" in by) {
				const regex = new RegExp(by.regex, "y");
				matcher.comparator = "regex:" + by.regex;
				matcher.order = 0.5 + baseOrder;
				matcher.match = function (text, pos) {
					regex.lastIndex = pos;
					const result = regex.exec(text);
					if (result == null) {
						return -1;
					} else {
						return result[0].length;
					}
				}
			}

		} else {
			matcher.comparator = "text:" + by;
			matcher.order = by.length + baseOrder;
			matcher.match = function (text, pos) {
				return text.startsWith(by, pos) ? by.length : -1;
			}
		}

		matchers.push(matcher);
	});
	return matchers;
}

function parseAfterMatchers(bys, baseOrder, stateName) {
	const matchers = [];
	forElementOrArray(bys, (by) => {

		const matcher = { minLength: by.length};

		if (typeof by == "object") {
			if ("text" in by) {
				matcher.match = function (text, pos) {
					return text == by.text;
				}
				matcher.comparator = "text:" + by.text;
				matcher.order = by.text.length + baseOrder;
				if ("regex" in by) {
					throw `Cannot set both "text" and "regex" in a single matcher, (text = "${by.text}", regex = "${by.regex}", "after.by" in state ${stateName})`;
				}
			} else if ("regex" in by) {
				matcher.comparator = "regex:" + by.regex;
				matcher.order = 0.5 + baseOrder;
				const regex = new RegExp(by.regex, "y");
				matcher.match = function (text, pos) {
					regex.lastIndex = pos;
					const result = regex.exec(text);
					if (result == null || result[0].length != text.length) {
						return false;
					} else {
						return true;
					}
				}
			}

		} else {
			matcher.comparator = "text:" + by;
			matcher.order = by.length + baseOrder;
			matcher.match = function (text, pos) {
				return text.startsWith(by, pos) ? by.length : -1;
			}
		}

		matchers.push(matcher);
	});
	return matchers;
}

function parseWhenConditions(when, allowedVariables, stateName){

	if (!when) return [];

	const checkVariableName = (name) => {
		//check for allowed variables
		if (!(name in allowedVariables)) {
			throw `Unallowed variable "${name}" in "when" (state ${stateName}). All values must be initialized on the default state.`;
		}
	}

	const ors = [];
	forElementOrArray(when, (condition) => {

		if (!(condition instanceof Object)) {
			throw `"when" value must be an object - instead is: ${condition} (state ${stateName})`;
		}

		const ands = [];
		for (const property in condition) {
			if (property.startsWith("@")) {
				if (property.startsWith("not:", 1)) {
					const propertyName = property.substring(5);
					checkVariableName(propertyName);

					const values = parseCheckValue(condition[property]);
					ands.push((context)=> {
						// console.log(propertyName, context.values[propertyName], values, !values.includes(context.values[propertyName]));
						return !values.includes(context.values[propertyName])
					});
				} else {
					throw `Unknown property: "${property}" in "when" in state "${stateName}"`;
				}
			} else {
				checkVariableName(property);

				const values = parseCheckValue(condition[property]);
				ands.push((context)=> {
					// console.log("TTT"+property, context.values[property], values, values.includes(context.values[property]));
					return values.includes(context.values[property])
				});
			}
		}

		ors.push(ands);
	});

	return ors;
}

function parseCheckValue(valueArray) {
	const values = [];
	forElementOrArray(valueArray, (value) => {


		if (typeof value == "string" && value.startsWith("@")) {
			if (value.startsWith("@", 1)) {
				values.push(value.substring(1));
			} else {
				throw `Unknown value: "${value}" in "when" in state "${stateName}"`;
			}
		} else {
			values.push(value);
		}

	});

	return values;
}


function parseSetters(setDefs, allowedVariables, stateName) {

	const checkVariableName = (name) => {
		//check for allowed variables
		if (!(name in allowedVariables)) {
			throw `Unallowed variable "${name}" in "set" (state ${stateName}). All values must be initialized on the default state.`;
		}
	}

	const setters = [];
	if (setDefs) {
		if (setDefs instanceof Object) {
			for (const setterName in setDefs) {
				const value = setDefs[setterName];
				let computeValue;
				if (typeof value == "string" && value.startsWith("@")) {
					if (value.startsWith("@",1)) {
						const actualValue = value.substring(1);
						computeValue = (context, valueName) => actualValue;
					} else if (value.startsWith("copy:", 1)) {
						const copyName = value.substring(6);
						if (!(copyName in allowedVariables)) {
							throw `Unallowed variable "${copyName}" in copy declaration (state ${stateName}). All values must be initialized on the default state.`;
						}
						computeValue = (context, valueName) => context.values[copyName];
					}else {
						const specialValue = value.substring(1);

						if (specialValue == "pop") {
							computeValue = (context, valueName) => {

								if (valueName in context.lists) {
									const list = context.lists[valueName]
									list.pop();
									// console.log("Pop " + valueName, list);
									return list.at(-1);
								} else {
									console.warn(`Trying to pop value from ${valueName} but it was empty`);
									return undefined;
								}
							}
						} else if (specialValue == "dequeue") {
							computeValue = (context, valueName) => {
								if (valueName in context.lists) {
									const list = context.lists[valueName]
									list.shift();
									return list.at(-1);
								} else {
									console.warn(`Trying to degueue value from ${valueName} but it was empty`);
									return undefined;
								}
							}
						} else {
							computeValue = (context, valueName) => {
								if (specialValue in context.specialValues) {
									const special = context.specialValues[specialValue]();
									return special;
								} else {
									throw `No special value "${specialValue}" available, consider placing it in different stage (state: "${stateName}")`;
								}
							};
						}
					}
				} else {
					computeValue = (context, valueName) => value;
				}


				// left side



				let setter;
				if (setterName.startsWith("@push:")) {
					const variableName = setterName.substring(6);
					checkVariableName(variableName);

					setter = (context) => {
						if (!(variableName in context.lists)) {
							if (variableName in context.values) {
								context.lists[variableName] = [context.values[variableName]];
							} else {
								context.lists[variableName] = [];
							}
						}
						const value = computeValue(context, variableName);
						context.values[variableName] = value;
						context.lists[variableName].push(value);
						// console.log("Push " + variableName, context.lists[variableName]);
					}
				} else if (setterName.startsWith("@queue:")) {
					const variableName = setterName.substring(7);
					checkVariableName(variableName);

					
					setter = (context) => {
						if (!(variableName in context.lists)) {
							if (variableName in context.values) {
								context.lists[variableName] = [context.values[variableName]];
							} else {
								context.lists[variableName] = [];
							}
						}
						const value = computeValue(context, variableName);
						context.values[variableName] = value;
						context.lists[variableName].unshift(value);
					}
				} else {
					if (setterName.indexOf(":") > -1) {
						throw `Unknown setter "${setterName}" in state "${stateName}"`;
					}

					const variableName = setterName;
					checkVariableName(variableName);

					setter = (context) => {
						context.values[variableName] = computeValue(context, variableName);
					}
				}

				setters.push(setter);
			}
		} else {
			throw `"set" value must be an object - instead is: ${setDefs} (state ${stateName})`;
		}
	}
	return setters;
}


//util functions
function prepareFunction(value) {
	if (!this.functionsAllowed) {
		throw "Functions are not allowed unless {allowFunctions: true} was specified in options. Only allow functions in languages from trusted sources.";
	}

	if (value instanceof Function) {
		return value;
	} else if (value instanceof String) {
		return new Function(value);
	} else {
		return null;
	}
}

function arrayize(data) {
	if (Array.isArray(data)){
		return data;
	} else {
		return [data];
	}
}

function appendToArray(array, push) {
	if (array === undefined){
		array = [];
	}

	array.push(push);
	return array;
}

function forElementOrArray(elOrAr, func) {
	if (Array.isArray(elOrAr)){
		for (const el of elOrAr){
			func(el);
		}
	} else {
		func(elOrAr);
	}
}

function ifUndefined(val, otherwise) {
	if (val === undefined) {
		return otherwise;
	} else {
		return val;
	}
}