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
			const lang = new StringTokenizerLanguage(json);

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

		/**
		 * Returns the index of a matching state begin (same target and by values)
		 * @param {*} list 
		 * @param {*} watch 
		 * @returns 
		 */
		const findSameWatch = (list, watch) => {
			return list.findIndex((el) => el.start == watch.start && el.target == watch.target && el.when == watch.when);
		}

		const watchForEverywhere = [];
		//compute begins and afters for every state
		for (const name in language){

			//where the state's start
			const begin = language[name].begin;
			if (begin !== undefined){
				forElementOrArray(begin, (begin) => {

					let matchers;
					if (begin.by !== undefined) {
						matchers = parseMatchers(begin.by);
					} else {
						if (begin.on === undefined) {
							throw "Cannot have begin without any of 'on' or 'by'  (state \"" + name + "\")";
						}
						matchers = [""];
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
					
					let watches = [];
					const targets = [name]; // previous idea was to apply this to many states at once - currently unused
					for (const target of targets){
						for (const start of matchers){
							watches.push({start: start, target: target, data: data, setters: setters, when: when, importance: importance});
						}
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

						for (const originState of where) {
							for (const watch of watches) {
								const ind = findSameWatch(originState.watchFor, watch);
								if (ind >= 0) {//duplicate
									throw "Duplicate change (by: \"" + watch.start + "\", on: \"" + originState.name + "\") in state " + watch.target;
	
									originState.watchFor[ind].importance = Math.max(originState.watchFor[ind].importance, watch.importance);
									originState.watchFor[ind].data = {...originState.watchFor[ind].data, ...watch.data};
								} else {
									originState.watchFor.push(watch);
								}
							}
						}
					} else {
						if (begin.everywhere === true) {
							watchForEverywhere.push(...watches);
						} else {
							throw "A begin without 'on' value must have \"'everywhere': true\" set (state \"" + name + "\")";
						}
					}

				});
			}

			//setting after
			const afterDefinition = language[name].after;
			if (afterDefinition !== undefined) {
				forElementOrArray(afterDefinition, (afterDefinition) => { 

					const after = {matchers: null, setters: [], data: {}};

					if (afterDefinition.by !== undefined) {
						after.matchers = parseMatchers(afterDefinition.by);
					}
					
					if (afterDefinition.then !== undefined) {
						after.setters = parseSetters(afterDefinition.then, allowedVariables, name);
					}
					if (afterDefinition.data !== undefined) {
						after.data = afterDefinition.data;
					}
					
					this.states[name].afters.push(after);
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

				const ind = findSameWatch(state.watchFor, watch);
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
				state.watchFor.sort((a,b) => {
					const impdif = b.importance - a.importance;
					if (impdif == 0){
						return b.start.length - a.start.length;
					} else {
						return impdif;
					}
				});
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

function parseMatchers(by) {
	return arrayize(by);
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