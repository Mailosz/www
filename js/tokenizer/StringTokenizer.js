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
	#lists = {};

	/**
	 * 
	 * @param {StringTokenizerLanguage} language 
	 * @param {String} text Initial text to parse
	 * @param {Object} options Initial text to parse
	 * @param {boolean} options.returnEmptyTokens Depending on used language, parsing may produce empty tokens - this options sets whether to return them or ignore
	 */
	constructor(language, text, options) {
		this.#lang = language;
		this.#text = text;
		this.#pos = 0;
		this.#tokenStart = 0;
		this.#state = language.states[language.defaultState];
		this.#lastMatcher = null;
		this.#values = language.defaultValues;
		this.#lists = {};
		this.options = {
			returnEmptyTokens: false,
			...options
		};
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

	getContext() {
		return {values: this.#values, lists: this.#lists};
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
		
		const matcher = this.#findMatch(this.#text, this.#pos, this.#state.watchFor);

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
		} else {
			this.#tokenStart = matcher.matchedPosition;
			token.end = this.#tokenStart;
			token.text = this.#text.substring(token.start, token.end);

			this.#computeAfters(token, this.#state);

			this.#state = this.#lang.states[matcher.target];
			this.#pos = matcher.matchedPosition + matcher.matchedLength;

			this.#lastMatcher = matcher;
			this.#setValues(this.#lastMatcher, {"beginContent": () => this.#text.substring(this.#tokenStart, this.#pos)});

			if (!this.options.returnEmptyTokens && token.start == token.end) {
				return this.getNextToken();
			}
		}

		return token;

	}

	#findMatch(text, startPos, matchers) {
		let pos = startPos;

		while (pos < this.#text.length) {
			const matcher = this.#findMatchAtPosition(text, pos, matchers); 
			if (matcher) {
				matcher.matchedPosition = pos;
				return matcher;
			}
			pos++;
		}
		return null;
	}

	/**
	 * Checks for a match starting at a specific character
	 * @param {String} text 
	 * @param {*} values 
	 * @param {*} state 
	 * @param {Number} pos 
	 * @returns 
	 */
	#findMatchAtPosition(text, pos, matchers) {

		outer:
			for (const matcher of matchers) {

				// checking in-depth if string matches new token start
				matcher.matchedLength = matcher.match(text, pos);
				if (matcher.matchedLength == -1) {
					continue;
				}
				//now checking all required values if they are set
				if (this.#checkConditions(matcher.conditions)) {
					//characters match and conditions match
					return matcher;
				}
			}
			return null;
	}

	#checkConditions(conditions) {
		if (conditions.length == 0) return true;
		const context = {values: this.#values};
		outer:
		for (const or of conditions) {
			for (const and of or) {
				if (!and(context)) {
					continue outer;
				}
			}
			return true;
		}
		return false;
	}

	#computeAfters(token, state) {

		for (const after of state.afters) {

			for (const matcher of after.matchers) {
				// checking in-depth if string matches new token start
				if (!matcher.match(token.text)) {
					continue;
				}
				//now checking all required values if they are set
				if (this.#checkConditions(matcher.conditions)) {
					//characters match and conditions match
					
					const tokenText = token.text;
					this.#setValues(after, {"tokenContent": () => tokenText});
					token.afterData = after.data;

					break;
				}
			}
		}
	}

	#setValues(obj, specialValues) {
		let context = {values: this.#values, lists: this.#lists, specialValues: specialValues};
		for (const setter of obj.setters) {
			setter(context);
		}



		// for (const variable in obj.vars.stackers) {
		// 	const value = obj.vars.setters[variable](this.#values, specialValues);
		// 	this.#values[variable] = value;
		// 	this.#lists[variable].push(value);
		// }
		// for (const variable in obj.vars.queuers) {
		// 	const value = obj.vars.setters[variable](this.#values, specialValues);
		// 	this.#values[variable] = value;
		// 	this.#lists[variable].unshift(value);
		// }
		// for (const variable in obj.vars.queuers) {
		// 	const value = obj.vars.setters[variable](this.#values, specialValues);
		// 	this.#values[variable] = value;
		// 	this.#lists[variable].unshift(value);
		// }
		// for (const variable in obj.vars.queuers) {
		// 	const value = obj.vars.setters[variable](this.#values, specialValues);
		// 	this.#values[variable] = value;
		// 	this.#lists[variable].unshift(value);
		// }
	}

}