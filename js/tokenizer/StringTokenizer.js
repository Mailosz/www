import { StringTokenizerLanguage, StringTokenizerLanguageService } from "./StringTokenizerLanguage.js";

export { StringTokenizerLanguage, StringTokenizerLanguageService };


export class StringTokenizer {
	#lang = null;
	#text = null;
	#pos = 0;
	#tokenStart = 0;
	#state = null;
	lastMatcher = null;
	#values = null;
	#hasFinished = false;
	#lastMatcher = null;

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
		this.#lastMatcher = null;
		this.#values = language.defaultValues;
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
		this.#setValues(this.#state, {"stateName": () => this.#state.name});
	}

	setPosition(pos) {
		this.#pos = pos;
	}

	setValues(values) {
		throw "Not implemented";
	}

	isFinished() {
		return this.#hasFinished;
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
		this.#setValues(this.#state, {"stateName": () => this.#state.name});
		
		const matcher = this.#findMatch(this.#text, this.#pos, this.#state.watchFor, this.#values);

		const token = {
			start: this.#tokenStart, 
			beginData: this.lastMatcher?.data, 
			data: this.#state.data, 
			afterData: {}, 
			state: this.#state.name
		};

		if (matcher === null) {
			this.#hasFinished = true;

			token.end = this.#text.length;
			token.text = this.#text.substring(token.start);

			this.#computeAfters(token, this.#state);

			token.values = this.#values;

		} else {
			this.#tokenStart = matcher.matchedPosition;
			token.end = this.#tokenStart;
			token.text = this.#text.substring(token.start, token.end);

			this.#computeAfters(token, this.#state);

			this.#state = this.#lang.states[matcher.target];
			this.#pos = matcher.matchedPosition + matcher.matchedLength;

			token.values = this.#values;
			this.#lastMatcher = matcher;
			this.#setValues(this.#lastMatcher, {"beginContent": () => this.#text.substring(this.#tokenStart, this.#pos)});
		}

		return token;

	}

	#findMatch(text, startPos, matchers, values) {
		let pos = startPos;

		while (pos < this.#text.length) {
			const matcher = this.#findMatchAtPosition(text, pos, matchers, values); 
			if (matcher) {
				matcher.matchedPosition = pos;
				return matcher;
			}
			pos++;
		}
		return null;
	}

	/**
	 * Checks a single character
	 * @param {String} text 
	 * @param {*} values 
	 * @param {*} state 
	 * @param {Number} pos 
	 * @returns 
	 */
	#findMatchAtPosition(text, pos, matchers, values) {

		outer:
			for (const matcher of matchers) {

				// checking in-depth if string matches new token start
				matcher.matchedLength = matcher.match(text, pos);
				if (matcher.matchedLength == -1) {
					continue;
				}
				//now checking all required values if they are set
				if (matcher.when != null) {
					for (const check in matcher.when){
						if (values[check] != matcher.when[check]){
							continue outer; // one of values not set
						}
					}
				}
				//all characters same, found new state
				return matcher;
			}
			return null;
	}

	#computeAfters(token, state) {

		const after = this.#findMatchAtPosition(token.text, 0, state.afters, this.#values);
		if (after) {
			const tokenText = token.text;
			this.#setValues(after, {"tokenContent": () => tokenText});
			token.afterData = after.data;
		}
	}

	#setValues(obj, specialValues) {
		for (const variable in obj.setters) {
			this.#values[variable] = obj.setters[variable](this.#values, specialValues);
		}
	}

}