


export class StringTokenizer {
	#lang = null;
	#text = null;
	#pos = 0;
	#tokenStart = 0;
	#state = null;
	#currentWatch = null;
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
		this.#currentWatch = {"beginData": {}};
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
		// compute values
		for (const setter of this.#state.setters) {
			setter(this.#values, {"stateName": () => this.#state.name});
		}
	}

	setPosition(pos) {
		this.#pos = pos;
	}

	setValues(values) {
		throw "Not implemented";
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

		if (!this.#hasFinished) {
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
		// execute state thens
		for (const setter of this.#state.setters) {
			setter(this.#values, {"stateName": () => this.#state.name});
		}
		let token = {start: this.#tokenStart, beginData: this.#currentWatch.data, data: this.#state.data, afterData: {}, state: this.#state.name, values: this.#values};

		while (true) {
			if (this.#pos >= this.#text.length) {
				token.text = this.#text.substring(token.start);
				token.end == this.#text.length;
				this.#hasFinished = true;
				break;
			} else {
				let watch = this.#checkChar(this.#text, this.#values, this.#state, this.#pos);
				if (watch != null){
					//finish token values
					token.end = this.#pos;
					token.text = this.#text.substring(token.start, token.end);

					// ececute afters for previous state
					for (const after of this.#state.afters) {
						if (after.matchers.includes(token.text)) { //TODO: proper matching
							for (const setter of after.setters) {
								setter(this.#values, {"tokenContent": () => token.text});
							}
							token.afterData = {...token.afterData, ...after.data};
						}
					}

					//change current state
					this.#state = this.#lang.states[watch.target];
					
					// execute thens for new state's used begin
					for (const setter of watch.setters) {
						setter(this.#values, {"beginContent": () => this.#text.substring(this.#tokenStart, this.#pos)});
					}
					this.#currentWatch = watch;
					
					this.#tokenStart = this.#pos;
					// no need to check it twice
					this.#pos += watch.start.length;
					break;
				}
				//check next character
				this.#pos++;
			}
		} 
		return token;

	}

	isFinished() {
		return this.#hasFinished;
	}
}