export class StringTokenizerLanguageService {

	static #cache = {}; 
	
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
			const lang = new StringTokenizerLanguage(json);
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
				setters: [],
				afters: [],
				computed: null};
		}

		// set first state as default, if no one yet set
		if (this.defaultState === null) {
			this.defaultState = Object.keys(this.states)[0];

			console.warn("No state set as default, using the first one, " + this.defaultState)
		}

		// compute allowed values (set in a default state)
		let allowedVariables = [];
		if (language[this.defaultState].then !== undefined){
			allowedVariables = Object.keys(language[this.defaultState].then);
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
			const then = language[name].then;
			if (then !== undefined) {
				this.states[name].setters = parseSetters(then, allowedVariables, name);
			}

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

					let matchers;
					if (begin.by !== undefined) {
						matchers = parseBy(begin.by, name);
					} else {
						if (begin.on === undefined) {
							throw "Cannot have begin without any of 'on' or 'by'  (state \"" + name + "\")";
						}
						// match everything matcher
						matchers = [emptyMatcher()];
					}

					let when = null;
					if (begin.when !== undefined) {
						when = begin.when;
					}

					let data = {};
					if (begin.data !== undefined) {
						data = begin.data;
					}

					let setters = [];
					if (begin.then !== undefined) {
						setters = parseSetters(begin.then, allowedVariables, name);
					}

					let importance;
					if (begin.importance !== undefined) {
						importance = begin.importance;
					} else {
						importance = 0;
					}

					// apply values to matchers
					for (const matcher of matchers){
						matcher.when = when;
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

					let matchers;
					if (after.by !== undefined) {
						matchers = parseBy(after.by, name);
					} else {
						matchers = [emptyMatcher()];
					}
					
					let setters = [];
					if (after.then !== undefined) {
						setters = parseSetters(after.then, allowedVariables, name);
					}
					let data = {};
					if (after.data !== undefined) {
						data = after.data;
					}
					let when = null;
					if (begin.when !== undefined) {
						when = begin.when;
					}

					for (const matcher of matchers) {
						matcher.setters = setters;
						matcher.data = data;
						matcher.when = when;
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

		console.log(this.states)
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
	const index = list.findIndex((b) => a.text === b.text
	&& a.target == b.target 
	&& a.when == b.when)
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
		return b.text.length - a.text.length;
	} else {
		return impdif;
	}
}

function emptyMatcher() {
	return {match: () => 0, text: "", minLength: 0, importance: 0};
}

function parseBy(bys, stateName) {
	const matchers = [];
	forElementOrArray(bys, (by) => {
		//TODO: accept objects

		const matcher = {text: by, minLength: by.length};

		if (typeof by == "object") {
			if ("text" in by) {
				matcher.match = function (text, pos) {
					return text.startsWith(matcher.text, pos) ? matcher.text.length : -1;
				}
				if ("regex" in by) {
					throw `Cannot set both "text" and "regex" in a single matcher (text = "${by.text}", regex = "${by.regex}", ,state ${stateName})`;
				}
			} else if ("regex" in by) {
				const regex = new RegExp(by.regex, "y");
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
			matcher.match = function (text, pos) {
				return text.startsWith(matcher.text, pos) ? matcher.text.length : -1;
			}
		}
		if (matcher.text !== undefined) {
			
			// for (let i = 0; i < matcher.text.length; i++){
			// 	// if characters don't match, then this is not the state you're looking for
			// 	if (matcher.text.charAt(i) !== text.charAt(pos + i)){
			// 		continue outer;
			// 	}
			// }
		} else if (matcher.regex) {

		}


		matchers.push(matcher);
	});
	return matchers;
}

function parseSetters(then, allowedVariables, stateName) {
	const setters = [];
	if (then instanceof Object) {
		for (const variableName in then) {
			const variable = then[variableName];

			//check for allowed variables
			if (!allowedVariables.includes(variableName)) {
				throw `Unallowed variable "${variableName}" (state ${stateName}). All values must be initialized on the default state.`;
			}

			if (variable instanceof Object) {
				console.log(variable, " is an object");

				let setter;
				if (variable.m === "stack") {
					setter = function (variableName, value, values) { throw "Not implemented" }
				} else if (variable.m === "queue") {
					setter = function (variableName, value, values) { throw "Not implemented" }
				} else if (variable.m === "pop") {
					setter = function (variableName, value, values) { throw "Not implemented" }
				} else if (variable.m === "deq") {
					setter = function (variableName, value, values) { throw "Not implemented" }
				} else if (variable.m === "set" || variable.m == null) {
					setter = function (variableName, value, values) { values[variableName] = value; }
				} else {
					throw `Unknown method "${variable}"`;
				}


				if ("v" in variable) {
					setter = (values, specialValues) => setter(variableName, variable.v, values);
					if ("c" in variable) {
						throw `Cannot set both "v" and "c" in a single setter (v = "${variable.v}", c = "${variable.var}", ,state ${stateName})`;
					} else if ("f" in variable) {
						throw `Cannot set both "v" and "s" in a single setter (v = "${variable.v}", s = "${variable.s}", ,state ${stateName})`;
					}
				} else if ("c" in variable) {
					//check for allowed variables
					if (!allowedVariables.includes(variable.c)) {
						throw `Unallowed variable "${variable.c}" (state ${stateName}). All values must be initialized on the default state.`;
					}
					const c = variable.c;
					setter = (values, specialValues) => setter(variableName, values[c], values);
					if ("s" in variable) {
						throw `Cannot set both "c" and "s" in a single setter (c = "${variable.c}", s = "${variable.s}", ,state ${stateName})`;
					}
				} else if ("s" in variable) {
					setter = (values, specialValues) => {
						if (variable.s in specialValues) {
							setter(variableName, specialValues[variable.s](), values);
						} else {
							throw `No special value "${variable.s}" available (state: "${stateName}")`;
						}
					};
				} else {
					throw `No value definition set in a setter (no 'v', 'c' or 's') in state "${stateName}"`;
				}
				setters.push(setter);
			} else {
				console.log(variable, " is a primitive");
				const setter = (values) => { values[variableName] = variable; };
				setters.push(setter);
			}
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