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
			const promise = await StringTokenizerLanguageService.#cache[identifier];
			if (promise) {
				return promise;
			}
		} catch(ex) {

		}

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

		let prepareFunction = (value) => {
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

		let arrayize = (data) => {
			if (Array.isArray(data)){
				return data;
			} else {
				return  [data];
			}
		}

		let appendToArray = (array, push) => {
			if (array === undefined){
				array = [];
			}

			array.push(push);
			return array;
		}

		let forElementOrArray = (elOrAr, func) => {
			if (Array.isArray(elOrAr)){
				for (const el of elOrAr){
					func(el);
				}
			} else {
				func(elOrAr);
			}
		}

		let ifUndefined = (val, otherwise) =>{
			if (val === undefined) {
				return otherwise;
			} else {
				return val;
			}
		}

		let warn = (str) => {warnList.push(str);};

		let warnList = [];
		this.states = [];
		this.defaultState = null;

		//get all possible states
		for (const name in language){
			if (this.states[name] !== undefined){
				throw "Duplicate state name: " + name;
			}
			this.states[name] = {name: name, 
				children: [],
				groupChildren: [],
				groups: [], 
				watchFor: [],
				data: {},
				set: {},
				computed: null};

		}

		//prepare states
		for (const name in language){
			//is default
			let isDefault = language[name].default;
			if (isDefault !== undefined){
				if (isDefault === true){
					if (this.defaultState === null) {
						this.defaultState = name;
					} else {
						throw "More than one state set as default";
					}
				}
			}

			//parents
			let parentName = language[name].parent;
			if (parentName !== undefined){
				if (Array.isArray){
					throw "Parent value cannot be an array";
				}
				let parentState = this.states[parentName];
				if (parentState === undefined){
					throw "No state named " + parentName + " (occured in a 'parent' on " + name + ")";
				}
				this.states[name].parent = parentState;
				parentState.children.push(this.states[name]);
			}

			//groups
			let group = language[name].group;
			if (group !== undefined){
				let groupNames = arrayize(group);
				let groupStates = [];
				for (let groupName of groupNames){
					if (groupName == name) {
						throw "State cannot have itself as a group (occured in a 'group' on " + name + ")";
					}
					let groupState = this.states[groupName];
					if (groupState === undefined){
						throw "No state named " + groupName + " (occured in a 'group' on " + name + ")";
					}
					groupStates.push(groupState);
					groupState.groupChildren.push(this.states[name]);
				}
				this.states[name].groups = groupStates;
				
			}

			//appending states' data
			let data = language[name].data;
			if (data !== undefined){
				this.states[name].data = data;
			}

			//sets
			let set = language[name].set;
			if (set !== undefined) {
				this.states[name].set = set;
			}
		}

		if (this.defaultState === null) {
			this.defaultState = Object.keys(this.states)[0];

			warn("No state set as default, using the first one, " + this.defaultState)
		}
					
		let readChange = (begin, name, where, targets) => {


			let by;
			if (begin.by !== undefined) {
				by = arrayize(begin.by);
			} else {
				if (begin.on === undefined) {
					throw "Cannot have begin without any of 'on' or 'by'  (state \"" + name + "\")";
				}
				by = [""];
			}

			let when = null;
			if (begin.when !== undefined) {
				when = begin.when;
			}

			let data;
			if (begin.data !== undefined) {
				data = begin.data;
			}

			let set = {};
			if (begin.set !== undefined) {
				set = begin.set;
			}

			let importance;
			if (begin.importance !== undefined) {
				importance = begin.importance;
			} else {
				importance = 0;
			}
			
			let watches = [];
			for (const target of targets){
				for (const start of by){
					watches.push({start: start, target: target, data: data, set: set, when: when, importance: importance});
				}
			}

			for (const s of where) {
				for (const watch of watches) {
					let ind = s.watchFor.findIndex((el) => el.start == watch.start && el.target == watch.target);
					if (ind >= 0) {//duplicate
						warn("Duplicate change (by: \"" + watch.by + "\", target: \"" + watch.target.name + ") on state " + s.name);

						s.watchFor[ind].importance = Math.max(s.watchFor[ind].importance, watch.importance);
						s.watchFor[ind].data = {...s.watchFor[ind].data, ...watch.data};
					} else {
						s.watchFor.push(watch);
					}
				}
			}

		}

		let valueNames;
		if (this.states[this.defaultState].set === undefined){
			valueNames = [];
		} else {
			valueNames = Object.keys(this.states[this.defaultState].set);
		}

		for (const stateName in this.states){
			const state = this.states[stateName];
			state.computed = this.#computeGroups(state, []);

			for (const val in state.set){
				if (!valueNames.includes(val)) {
					throw "Unallowed value \"" + val + "\". All values must be initialized on the default state.";
				}
			}
			//TODO: same check for values on a watch
		}

		//parse changes
		for (const name in language){

			//where the state's start
			let begin = language[name].begin;
			if (begin !== undefined){
				forElementOrArray(begin, (begin) => {

					let where;
					if (begin.on !== undefined) {
						where = [];
						let names = arrayize(begin.on);
		
						for (const n of names) {
							if (this.states[n] === undefined){
								throw "No such state: " + n;
							}
							where.push(this.states[n]);
							
							for (const child of this.states[n].children){
								where.push(child);
							}
				
							for (const child of this.states[n].groupChildren){
								where.push(child);
							}
						}
						
					} else {
						if (begin.everywhere) {
							where = this.states;
						} else {
							throw "A change without 'on' value must have \"'everywhere': true\" set (state \"" + name + "\")";
						}
					}

					readChange(begin, name, where, [name]);
				});
			}

			//where is the state's end
			let end = language[name].end;
			if (end !== undefined){
				forElementOrArray(end, (end) => readChange(end, name, [this.states[name]], [null]));
			}

		}

		//checking
		for (const stateName in this.states){
			const state = this.states[stateName];
			if (state.watchFor === undefined ){
				if (state.immediate === undefined && !state.isFinal) {
					throw "State " + stateName + " has no way out and is not final";
				}
			} else {

				//sorting watchFors by importance and length
				state.watchFor.sort((a,b) => {
					const impdif = a.importance - b.importance;
					if (impdif == 0){
						return b.start.length - a.start.length;
					} else {
						return impdif;
					}
				});
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
			state.computed = {data: state.data, set: state.set};

			if (state.groups.length == 0){
				return state.computed;
			} else {
				let nh = [...history, state.name];
				for (const group of state.groups) {
					let from = this.#computeGroups(group, nh);
					state.computed.data = {...from.data, ...state.computed.data};
					state.computed.set = {...from.set, ...state.computed.set};
				}
				return state.computed;
			}
		}
		
		
	}
}

export class StringTokenizer {
	#lang = null;
	#text = null;
	#pos = 0;
	#tokenStart = 0;
	#state = null;
	#beginData = null;
	#values = null;
	#hasFinished = false;

	/**
	 * 
	 * @param {StringTokenizerLanguage} language 
	 * @param {String} text Initial text to parse
	 */
	constructor(language, text) {
		this.#lang = language;
		this.#text = text;
		this.#pos = 0;
		this.#tokenStart = 0;
		this.#state = language.states[language.defaultState];
		this.#beginData = {};
		this.#values = {};
		this.#hasFinished = text == null; // if no text passed then the tokenizer is finished
	}

	/**
	 * Sets current state
	 * @param {String} state State name
	 */
	setState(state) {
		if (!this.#lang.states.hasOwnProperty(state)) {
			throw "Cannot set state '"+ state +"' because it doesn't exist in the language";
		}
		this.#state = this.#lang.states[state];
	}

	setPosition(pos) {
		this.#pos = pos;
	}

	setValues(values) {
		throw "Not implemented";
	}

	setBeginData(beginData) {
		this.#beginData = beginData;
	}

	getBeginData() {
		return this.#beginData;
	}


	/**
	 * Checks a single character
	 * @param {String} text 
	 * @param {*} values 
	 * @param {*} state 
	 * @param {Number} pos 
	 * @returns 
	 */
	 #checkChar(text, values, state, pos) {
		//let char = text.charAt(pos);

		outer:
			for (const watch of state.watchFor) {
				if (pos + watch.start.length > text.length) {
					//this begin is too long
					continue;
				}
				//checking in-depth if string matches new token start
				for (let i = 0; i < watch.start.length; i++){
					// if characters don't match, then this is not the state you're looking for
					if (watch.start.charAt(i) != text.charAt(pos + i)){
						continue outer;
					}
				}
				//now checking all required values if they are set
				if (watch.when != null) {
					for (const check in watch.when){
						if (values[check] !== watch.when[check]){
							continue outer; // one of values not set
						}
					}
				}
				//all characters same, found new state
				return watch;
			}
			return null;
	}

	/**
	 * Sets text to parse while keeping current state
	 * @param {String} text 
	 */
	resetText(text) {
		this.#text = text;
		this.#pos = 0;
		this.#tokenStart = 0;

		if (this.#hasFinished) {
			console.warn("Resetting parse text before it has been fully consumed")
		}
		this.#hasFinished = text == null;
	}

	/**
	 * Iterator inteface implementation
	 * @returns 
	 */
	next() {
		return {value: this.getNextToken(), done: this.#hasFinished};
	}

	getNextToken() {
		if (this.#pos > this.#text.length) {
			this.#hasFinished = true;
			if (this.#tokenStart < this.#text.length) { //reached end of text
				let token = {start: this.#tokenStart, beginData: this.#beginData, data: this.#state.data, state: this.#state.name};
				token.text = this.#text.substring(token.start);
				token.end == this.#text.length;
				return token;
			}
			return null;
		} else {
			let token = {start: this.#tokenStart, beginData: this.#beginData, data: this.#state.data, state: this.#state.name};

			while (true) {
				let watch = this.#checkChar(this.#text, this.#values, this.#state, this.#pos);
				if (watch != null){
					//change current state
					this.#state = this.#lang.states[watch.target];
					this.#beginData = watch.data;
					//finish token values
					token.end = this.#pos;
					token.text = this.#text.substring(token.start, token.end);

					//merge current values with the ones of a watch, and a state
					this.#values = {...this.#values, ...watch.set, ...this.#state.set};

					this.#tokenStart = this.#pos;
					// no need to check it twice
					this.#pos += watch.start.length;
					break;
				} else {
					//check next character
					this.#pos++;
					if (this.#pos >= this.#text.length) { //reached end of text
						token.text = this.#text.substring(token.start);
						token.end == this.#text.length;
						this.#hasFinished = true;
						break;
					}
				}
			} 

			return token;

		} 
	}

	isFinished() {
		return this.#hasFinished;
	}
}