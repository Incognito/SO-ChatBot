(function () {
"use strict";

////IO start
var IO = window.IO = {
	//event handling
	events : {},
	preventDefault : false,

	//register for an event
	register : function ( name, fun, thisArg ) {
		if ( !this.events[name] ) {
			this.events[ name ] = [];
		}
		this.events[ name ].push({
			fun : fun,
			thisArg : thisArg,
			args : Array.prototype.slice.call( arguments, 3 )
		});

		return this;
	},

	unregister : function ( name, fun ) {
		if ( !this.events[name] ) {
			return this;
		}

		this.events[ name ] = this.events[ name ].filter(function ( obj ) {
			return obj.fun !== fun;
		});

		return this;
	},

	//fire event!
	fire : function ( name ) {
		this.preventDefault = false;

		if ( !this.events[name] ) {
			return;
		}

		var args = Array.prototype.slice.call( arguments, 1 ),
			that = this;
		this.events[ name ].forEach( fireEvent );

		function fireEvent( evt ) {
			var call = evt.fun.apply( evt.thisArg, evt.args.concat(args) );

			if ( call === false ) {
				that.preventDefault = true;
			}
		}
	},

	//it's a very incomplete, non-comprehensive implemantation, since I only
	// use it for POST requests
	xhr : function ( params ) {
		params.headers = params.headers || {
			'Content-Type' : 'application/x-www-form-urlencoded'

		};

		if ( typeof params.data === 'object' ) {
			params.data = IO.urlstringify( params.data );
		}

		var xhr = new XMLHttpRequest(), complete = params.complete;
		xhr.open( params.method || 'GET', params.url );

		xhr.addEventListener( 'readystatechange', function () {
			if ( xhr.readyState === 4 && complete && complete.call ) {
				complete.call(
					params.thisArg, xhr.responseText, xhr
				);
			}
		});

		Object.keys( params.headers ).forEach(function ( header ) {
			xhr.setRequestHeader( header, params.headers[header] );
		});

		xhr.send( params.data );

		return xhr;
	},

	jsonp : function ( opts ) {
		var script = document.createElement( 'script' ),
			semiRandom = 'IO_' + ( Date.now() * Math.ceil(Math.random()) );

		window[ semiRandom ] = function () {
			opts.fun.apply( opts.thisArg, arguments );

			//cleanup
			window[ semiRandom ] = null;
			script.parentNode.removeChild( script );
		};

		if ( opts.url.indexOf('?') === -1 ) {
			opts.url += '?';
		}

		if ( typeof opts.data === 'object' ) {
			opts.url += IO.urlstringify( opts.data );
		}
		opts.jsonpName = opts.jsonpName || 'jsonp';

		script.src = opts.url + '&' + opts.jsonpName + '=' + semiRandom;
		document.head.appendChild( script );
	},

	urlstringify : (function () {
		//simple types, for which toString does the job
		//used in singularStringify
		var simplies = { number : true, string : true, boolean : true };

		var singularStringify = function ( thing ) {
			if ( typeof thing in simplies ) {
				return encodeURIComponent( thing.toString() );
			}
			return '';
		};

		var arrayStringify = function ( array, keyName ) {
			keyName = singularStringify( keyName );

			return array.map(function ( thing ) {
				return keyName + '=' + singularStringify( thing );
			});
		};

		return function ( obj ) {
			return Object.keys( obj ).map(function ( key ) {
				var val = obj[ key ];

				if ( Array.isArray(val) ) {
					return arrayStringify( val, key );
				} else {
					return singularStringify(key) +
						'=' + singularStringify( val );
				}
			}).join( '&' );
		};
	}()),

	loadScript : function ( url, cb ) {
		var script = document.createElement( 'script' );
		script.src = url;
		script.onload = cb;
		document.head.appendChild( script );
	}
};

IO.decodehtml = (function (){
var entities = {"quot":"\"","amp":"&","apos":"'","lt":"<","gt":">","nbsp":" ","iexcl":"¡","cent":"¢","pound":"£","curren":"¤","yen":"¥","brvbar":"¦","sect":"§","uml":"¨","copy":"©","ordf":"ª","laquo":"«","not":"¬","reg":"®","macr":"¯","deg":"°","plusmn":"±","sup2":"²","sup3":"³","acute":"´","micro":"µ","para":"¶","middot":"·","cedil":"¸","sup1":"¹","ordm":"º","raquo":"»","frac14":"¼","frac12":"½","frac34":"¾","iquest":"¿","Agrave":"À","Aacute":"Á","Acirc":"Â","Atilde":"Ã","Auml":"Ä","Aring":"Å","AElig":"Æ","Ccedil":"Ç","Egrave":"È","Eacute":"É","Ecirc":"Ê","Euml":"Ë","Igrave":"Ì","Iacute":"Í","Icirc":"Î","Iuml":"Ï","ETH":"Ð","Ntilde":"Ñ","Ograve":"Ò","Oacute":"Ó","Ocirc":"Ô","Otilde":"Õ","Ouml":"Ö","times":"×","Oslash":"Ø","Ugrave":"Ù","Uacute":"Ú","Ucirc":"Û","Uuml":"Ü","Yacute":"Ý","THORN":"Þ","szlig":"ß","agrave":"à","aacute":"á","acirc":"â","atilde":"ã","auml":"ä","aring":"å","aelig":"æ","ccedil":"ç","egrave":"è","eacute":"é","ecirc":"ê","euml":"ë","igrave":"ì","iacute":"í","icirc":"î","iuml":"ï","eth":"ð","ntilde":"ñ","ograve":"ò","oacute":"ó","ocirc":"ô","otilde":"õ","ouml":"ö","divide":"÷","oslash":"ø","ugrave":"ù","uacute":"ú","ucirc":"û","uuml":"ü","yacute":"ý","thorn":"þ","yuml":"ÿ","OElig":"Œ","oelig":"œ","Scaron":"Š","scaron":"š","Yuml":"Ÿ","fnof":"ƒ","circ":"ˆ","tilde":"˜","Alpha":"Α","Beta":"Β","Gamma":"Γ","Delta":"Δ","Epsilon":"Ε","Zeta":"Ζ","Eta":"Η","Theta":"Θ","Iota":"Ι","Kappa":"Κ","Lambda":"Λ","Mu":"Μ","Nu":"Ν","Xi":"Ξ","Omicron":"Ο","Pi":"Π","Rho":"Ρ","Sigma":"Σ","Tau":"Τ","Upsilon":"Υ","Phi":"Φ","Chi":"Χ","Psi":"Ψ","Omega":"Ω","alpha":"α","beta":"β","gamma":"γ","delta":"δ","epsilon":"ε","zeta":"ζ","eta":"η","theta":"θ","iota":"ι","kappa":"κ","lambda":"λ","mu":"μ","nu":"ν","xi":"ξ","omicron":"ο","pi":"π","rho":"ρ","sigmaf":"ς","sigma":"σ","tau":"τ","upsilon":"υ","phi":"φ","chi":"χ","psi":"ψ","omega":"ω","thetasym":"ϑ","upsih":"ϒ","piv":"ϖ","ensp":" ","emsp":" ","thinsp":" ","ndash":"–","mdash":"—","lsquo":"‘","rsquo":"’","sbquo":"‚","ldquo":"“","rdquo":"”","bdquo":"„","dagger":"†","Dagger":"‡","bull":"•","hellip":"…","permil":"‰","prime":"′","Prime":"″","lsaquo":"‹","rsaquo":"›","oline":"‾","frasl":"⁄","euro":"€","image":"ℑ","weierp":"℘","real":"ℜ","trade":"™","alefsym":"ℵ","larr":"←","uarr":"↑","rarr":"→","darr":"↓","harr":"↔","crarr":"↵","lArr":"⇐","uArr":"⇑","rArr":"⇒","dArr":"⇓","hArr":"⇔","forall":"∀","part":"∂","exist":"∃","empty":"∅","nabla":"∇","isin":"∈","notin":"∉","ni":"∋","prod":"∏","sum":"∑","minus":"−","lowast":"∗","radic":"√","prop":"∝","infin":"∞","ang":"∠","and":"∧","or":"∨","cap":"∩","cup":"∪","int":"∫","there4":"∴","sim":"∼","cong":"≅","asymp":"≈","ne":"≠","equiv":"≡","le":"≤","ge":"≥","sub":"⊂","sup":"⊃","nsub":"⊄","sube":"⊆","supe":"⊇","oplus":"⊕","otimes":"⊗","perp":"⊥","sdot":"⋅","lceil":"⌈","rceil":"⌉","lfloor":"⌊","rfloor":"⌋","lang":"〈","rang":"〉","loz":"◊","spades":"♠","clubs":"♣","hearts":"♥","diams":"♦"};

return function ( html ) {
	//capture &blah; &blah;bloo and &#1337
	return html.replace( /\&#?[\w;]+;/g, function ( entity ) {
		//remove the & and split into each separate entity
		return entity.slice( 1 ).split( ';' ).map(function ( entity ) {
			//starts with a #, grab what it represents
			if ( entity[0] === '#' ) {
				return String.fromCharCode( Number(entity.slice(1)) );
			}
			//grab the entity
			return entities[ entity ] || entity;
		//join the separate entities together
		}).join( '' );
	});
};
}());

//build IO.in and IO.out
[ 'in', 'out' ].forEach(function ( dir ) {
	var fullName = dir + 'put';

	IO[ dir ] = {
		buffer : [],

		receive : function ( obj ) {
			IO.fire( 'receive' + fullName, obj );

			if ( IO.preventDefault ) {
				bot.log( obj, 'preventDefault' );
				return this;
			}

			this.buffer.push( obj );

			return this;
		},

		//unload the next item in the buffer
		tick : function () {
			if ( this.buffer.length ) {
				IO.fire( fullName, this.buffer.shift() );
			}

			return this;
		},

		//unload everything in the buffer
		flush : function () {
			IO.fire( 'before' + fullName );

			if ( !this.buffer.length ) {
				return this;
			}

			var i = this.buffer.length;
			while( i --> 0 ) {
				this.tick();
			}

			IO.fire( 'after' + fullName );

			this.buffer = [];

			return this;
		}
	};
});
////IO end

////bot start
var bot = window.bot = {
	invocationPattern : '!!',

	roomid : parseFloat( location.pathname.match(/\d+/)[0] ),

	commandRegex : /^\/([\w\-]+)(?:\s(.+))?$/,
	commands : {}, //will be filled as needed
	commandDictionary : null, //it's null at this point, won't be for long
	listeners : [],

	parseMessage : function ( msgObj ) {
		bot.log( msgObj, 'parseMessage input' );

		if ( !this.validateMessage(msgObj) ) {
			bot.log( msgObj, 'parseMessage invalid' );
			return;
		}

		var msg = IO.decodehtml(msgObj.content);
		msg = msg.slice( this.invocationPattern.length ).trim();
		msg = this.Message( msg, msgObj );

		bot.log( msg, 'parseMessage valid' );

		if ( this.banlist.contains(msgObj.user_id) ) {
			bot.log( msgObj, 'parseMessage banned' );
			//TODO: remove this after testing, and push if block up
			msg.reply( 'You iz in mindjail' );
			return;
		}

		try {
			//it's a command
			if ( msg.startsWith('/') ) {
				bot.log( msg, 'parseMessage command' );
				this.parseCommand( msg );
				return;
			}

			//see if some hobo listener wants this
			this.callListeners( msg );
		}
		catch ( e ) {
			var err = 'Could not process input. Error: ' + e.message;

			if ( e.lineNumber ) {
				err += ' on line ' + e.lineNumber;
			}
			if ( e.column ) {
				err += ' on column ' + e.column;
			}

			msg.directreply( err );

			console.error( e, err );
		}
	},

	parseCommand : function ( msg ) {
		bot.log( msg, 'parseCommand input' );

		var commandParts = this.commandRegex.exec( msg );
		if ( !commandParts ) {
			msg.reply( 'Invalid command ' + msg );
			return;
		}

		var commandName = commandParts[ 1 ].toLowerCase();

		bot.log( commandParts, 'parseCommand matched' );

		var cmdObj = this.getCommand( commandName );
		if ( cmdObj.error ) {
			msg.reply( cmdObj.error );
			return;
		}

		if ( !cmdObj.canUse(msg.get('user_id')) ) {
			msg.reply(
				'You do not have permission to use the command ' +
					commandName
			);
			return;
		}

		bot.log( cmdObj, 'parseCommand calling' );

		var args = this.Message(
			//+ 1 is for the / in the message
			msg.slice( commandName.length + 1 ).trim(),
			msg.get()
		);
		var res = cmdObj.exec( args );

		if ( res ) {
			msg.reply( res );
		}
	},

	validateMessage : function ( msgObj ) {
		var msg = msgObj.content.toLowerCase().trim();

		//all we really care about
		return msg.startsWith( this.invocationPattern );
	},

	//gee, I wonder what this will return?
	commandExists : function ( cmdName ) {
		return this.commands.hasOwnProperty( cmdName );
	},

	//if a command named cmdName exists, it returns that command object
	//otherwise, it returns an object with an error message property
	getCommand : function ( cmdName ) {
		if ( !this.commandExists(cmdName) ) {
			//set the error margin according to the length
			this.commandDictionary.maxCost = Math.floor(
				cmdName.length / 5 + 1
			);

			var msg = 'Command ' + cmdName + ' does not exist.',
				//find commands resembling the one the user entered
				guesses = this.commandDictionary.search( cmdName );

			if ( guesses.length ) {
				msg += ' Did you mean: ' + guesses.join( ', ' );
			}

			return {
				error : msg
			};
		}

		return this.commands[ cmdName ];
	},

	//the function women think is lacking in men
	listen : function ( regex, fun, thisArg ) {
		if ( Array.isArray(regex) ) {
			regex.forEach(function ( reg ) {
				this.listen( reg, fun, thisArg );
			}, this );
		}
		else {
			this.listeners.push({
				pattern : regex,
				fun : fun,
				thisArg: thisArg
			});
		}
	},

	callListeners : function ( msg ) {
		var fired = false;

		this.listeners.forEach(function ( listener ) {
			var match = msg.exec( listener.pattern ), resp;

			if ( match ) {
				fired = true;
				resp = listener.fun.call( listener.thisArg, msg );

				bot.log( match, resp );
				if ( resp ) {
					msg.reply( resp );
				}
			}
		});

		if ( !fired ) {
			msg.reply( 'Y U NO MAEK SENSE!?' );
		}
	},

	reply : function ( msg, msgObj ) {
		var usr = msgObj.user_name.replace( /\s/g, '' ),
			roomid = msgObj.room_id;

		output.add( '@' + usr + ' ' + msg, roomid );
	},

	directreply : function ( msg, msgObj ) {
		var msgid = msgObj.message_id, roomid = msgObj.room_id;
		output.add( ':' + msgid + ' ' + msg, roomid );
	},

	//some awesome in function form
	addCommand : function ( cmd ) {
		if ( !cmd.exec || !cmd.del ) {
			cmd = this.Command( cmd );
		}

		this.commands[ cmd.name ] = cmd;
		this.commandDictionary.trie.add( cmd.name );
	},

	stoplog : false,
	log : function () {
		if ( !this.stoplog ) {
			console.log.apply( console, arguments );
		}
	},

	stop : function () {
		this.stopped = true;
	},
	continue : function () {
		this.stopped = false;
	}
};

bot.banlist = [];
bot.banlist.contains = function ( item ) {
	return this.indexOf( item ) >= 0;
};
bot.banlist.add = function ( item ) {
	return this.push( item );
};
bot.banlist.remove = function ( item ) {
	var idx = this.indexOf( item );
	if ( idx >= 0 ) {
		return this.splice( idx, 1 );
	}
	else {
		return null;
	}
};

bot.Command = function ( cmd ) {
	cmd.name = cmd.name.toLowerCase();

	cmd.permissions = cmd.permissions || {};
	cmd.permissions.use = cmd.permissions.use || 'ALL';
	cmd.permissions.del = cmd.permissions.del || 'NONE';

	cmd.description = cmd.description || '';

	cmd.canUse = function ( usrid ) {
		var use = this.permissions.use;
		return use === 'ALL' || use !== 'NONE' &&
			use.indexOf( usrid ) > -1;
	};

	cmd.canDel = function ( usrid ) {
		var del = this.permissions.del;
		return del !== 'NONE' && del === 'ALL' ||
			del.indexOf( usrid ) > -1;
	};

	cmd.exec = function () {
		return this.fun.apply( this.thisArg, arguments );
	};

	cmd.del = function () {
		delete bot.commands[ cmd.name ];
	};

	return cmd;
};

bot.Message = function ( text, msgObj ) {
	//"casting" to object so that it can be extended with cool stuff and
	// still be treated like a string
	var ret = Object( text );
	ret.content = text;

	var deliciousObject = {
		respond : function ( resp ) {
			output.add( resp, msgObj.room_id );
		},

		reply : function ( resp, usrname ) {
			usrname = usrname || msgObj.user_name;

			bot.reply( resp, Object.merge(msgObj, {user_name : usrname}) );
		},
		directreply : function ( resp, msgid ) {
			msgid = msgid || msgObj.message_id;

			bot.directreply( resp, Object.merge(msgObj, {message_id : msgid}) );
		},

		codify : function ( msg ) {
			var tab = '    ',
				spacified = msg.replace( '\t', tab ),
				lines = spacified.split( /[\n\r]/g );

			return lines.reduce(function ( ret, line ) {
				if ( !line.startsWith(tab) ) {
					line = tab + line;
				}
				return ret + line + '\n';
			}, '' );
		},

		parse : function () {
			return bot.parseCommandArgs( text );
		},

		//execute a regexp against the text, saving it inside the object
		exec : function ( regexp ) {
			var match = regexp.exec( text );
			this.matches = match ? match : [];

			return match;
		},

		//retrieve a value from the original message object, or if no argument
		// provided, the msgObj itself
		get : function ( what ) {
			if ( !what ) {
				return msgObj;
			}
			return msgObj[ what ];
		},
		set : function ( what, val ) {
			return msgObj[ what ] = val;
		}
	};

	Object.keys( deliciousObject ).forEach(function ( key ) {
		ret[ key ] = deliciousObject[ key ];
	});

	return ret;
};

IO.register( 'receiveinput', bot.validateMessage, bot );
IO.register( 'input', bot.parseMessage, bot );
////bot ends

////utility start
var polling = {
	//used in the SO chat requests, dunno exactly what for, but guessing it's
	// the latest id or something like that
	times : {},

	pollInterval : 5000,

	init : function () {
		var that = this,
			roomid = location.pathname.match( /\d+/ )[ 0 ];

		IO.xhr({
			url : '/chats/' + roomid + '/events/',
			data : fkey({
				since : 0,
				mode : 'Messages',
				msgCount : 0
			}),
			method : 'POST',
			complete : finish
		});

		function finish ( resp ) {
			resp = JSON.parse( resp );
			bot.log( resp );

			that.times[ 'r' + roomid ] = resp.time;

			that.loopage();
		}
	},

	poll : function () {
		var that = this;

		IO.xhr({
			url : '/events',
			data : fkey( that.times ),
			method : 'POST',
			complete : that.pollComplete,
			thisArg : that
		});
	},

	pollComplete : function ( resp ) {
		if ( !resp ) {
			return;
		}
		resp = JSON.parse( resp );

		var that = this;
		//each key will be in the form of rROOMID
		Object.keys( resp ).forEach(function ( key ) {
			var msgObj = resp[ key ];

			//t is a...something important
			if ( msgObj.t ) {
				that.times[ key ] = msgObj.t;
			}

			//e is an array of events, what is referred to in the bot as msgObj
			if ( msgObj.e ) {
				msgObj.e.forEach( that.handleMessageObject, that );
			}
		});

		//handle all the input
		IO.in.flush();
	},

	handleMessageObject : function ( msg ) {
		//event_type of 1 means new message, 2 means edited message
		if ( msg.event_type !== 1 && msg.event_type !== 2 ) {
			return;
		}

		//check for a multiline message
		var multiline, tag = '<div class=\'full\'>';
		if ( msg.content.startsWith(tag) ) {
			//remove the enclosing tag
			multiline = msg.content
				.slice( 0, msg.content.lastIndexOf('</div>') )
				.replace( tag, '' );

			//iterate over each line
			multiline.split( '<br>' ).forEach(function ( line ) {
				line = line.trim();

				//and treat it as if it were a separate message
				this.handleMessageObject(
					Object.merge( msg, { content : line })
				);
			}, this );

			return;
		}

		//add the message to the input buffer
		IO.in.receive( msg );
	},

	loopage : function () {
		var that = this;

		setTimeout(function () {
			that.poll();
			that.loopage();
		}, this.pollInterval );
	}
};
polling.init();

var output = {
	messages : {},

	//add a message to the output queue
	add : function ( msg, roomid ) {
		roomid = roomid || bot.roomid;
		IO.out.receive({
			text : msg + '\n',
			room : roomid
		});
	},

	//build the final output
	build : function ( obj ) {
		if ( !this.messages[obj.room] ) {
			this.messages[ obj.room ] = '';
		}
		this.messages[ obj.room ] += obj.text;
	},

	//and send output to all the good boys and girls
	send : function () {
		//unless the bot's stopped. in which case, it should shut the fudge up
		// the freezer and never let it out. not until it can talk again. what
		// was I intending to say?
		if ( !bot.stopped ) {
			Object.keys( this.messages ).forEach(function ( room ) {
				var message = this.messages[ room ];

				if ( !message ) {
					return;
				}

				this.sendToRoom( message, room );
			}, this );
		}

		this.messages = {};
	},

	sendToRoom : function ( text, room ) {
		IO.xhr({
			url : '/chats/' + room + '/messages/new',
			data : {
				text : text,
				fkey : fkey().fkey
			},
			method : 'POST',
			complete : complete
		});

		function complete ( resp, xhr ) {
			bot.log( xhr.status );

			//conflict, wait for next round to send message
			if ( xhr.status === 409 ) {
				output.add( text, room );
			}
		}
	},

	loopage : function () {
		IO.out.flush();
	}
};
output.timer = setInterval( output.loopage, 5000 );

IO.register( 'output', output.build, output );
IO.register( 'afteroutput', output.send, output );

//small utility functions
Object.merge = function () {
	return [].reduce.call( arguments, function ( ret, merger ) {

		Object.keys( merger ).forEach(function ( key ) {
			ret[ key ] = merger[ key ];
		});

		return ret;
	}, {} );
};

String.prototype.indexesOf = function ( str, fromIndex ) {
	//since we also use index to tell indexOf from where to begin, and since
	// telling it to begin from where it found the match will cause it to just
	// match it again and again, inside the indexOf we do `index + 1`
	// to compensate for that 1, we need to subtract 1 from the original
	// starting position
	var index = ( fromIndex || 0 ) - 1,
		ret = [];

	while ( (index = this.indexOf(str, index + 1)) > -1 ) {
		ret.push( index );
	}

	return ret;
};
String.prototype.startsWith = function ( str ) {
	return this.indexOf( str ) === 0;
};

//SO chat uses an unfiltered for...in to iterate over an array somewhere, so
// that I have to use Object.defineProperty to make these non-enumerable
Object.defineProperty( Array.prototype, 'invoke', {
	value : function ( funName ) {
		var args = [].slice.call( arguments, 1 ), ret = [];

		this.forEach(function ( item, index ) {
			var res = item;

			if ( item[funName] && item[funName].call ) {
				res = item[ funName ].call( item, args );
			}

			ret[ index ] = res;
		});

		return ret;
	},

	configurable : true,
	writable : true
});

//async memoizer
Function.prototype.memoizeAsync = function ( cb, thisArg ) {
	var cache = Object.create( null ), fun = this;

	return function ( hash ) {
		if ( cache[hash] ) {
			return cache[ hash ];
		}
		//turn arguments into an array
		var args = [].slice.call( arguments );

		//and push the callback to it
		args.push(function ( res ) {
			cache[ hash ] = res;
			cb.apply( thisArg, arguments );
		});

		return fun.apply( this, args );
	};
};
////utility end

//a Trie suggestion dictionary, made by Esailija
// http://stackoverflow.com/users/995876/esailija
//used in the "command not found" message to show you closest commands
var SuggestionDictionary = (function () {

function TrieNode() {
	this.word = null;
	this.children = {};
}

TrieNode.prototype.add = function( word ) {
	var node = this, char, i = 0;

	while( char = word.charAt(i++) ) {

		if( !( char in node.children ) ) {
			node.children[char] = new TrieNode();
		}

		node = node.children[char];

	}

	node.word = word;
};


//Having a small maxCost will increase performance greatly, experiment with
//values of 1-3
function SuggestionDictionary( maxCost ) {
	if( !( this instanceof SuggestionDictionary ) ) {
		throw new TypeError( "Illegal function call" );
	}

	maxCost = parseInt( maxCost, 10 );

	if( isNaN( maxCost ) || maxCost < 1 ) {
		throw new TypeError( "maxCost must be an integer > 1 " );
	}

	this.maxCost = maxCost;
	this.trie = new TrieNode();
}

SuggestionDictionary.prototype = {

	constructor: SuggestionDictionary,

	build: function( words ) {
		if( !Array.isArray( words ) ) {
			throw new TypeError( "Cannot build a dictionary from "+words );
		}

		this.trie = new TrieNode();

		words.forEach(function ( word ) {
			this.trie.add( word );
		}, this);
	},

	__sortfn: function( a, b ) {
		return a[1] - b[1];
	},

	search: function( word ) {
		word = word.valueOf();
		var r;

		if( typeof word !== "string" ) {
			throw new TypeError( "Cannot search "+word );
		}

		if( this.trie == null ) {
			throw new TypeError( "Cannot search, dictionary isn't built yet" );
		}

		r = search( word, this.maxCost, this.trie );
		//r will be array of arrays:
		//["word", cost], ["word2", cost2], ["word3", cost3] , ..

		r.sort( this.__sortfn ); //Sort the results in order of least cost


		return r.map(function ( subarr ) {
			return subarr[ 0 ];
		});
	}
};

function range( x, y ) {
	var r = [], i, l, start;

	if( y == null ) {
		start = 0;
		l = x;
	}
	else {
		start = x;
		l = y-start;
	}

	for( i = 0; i < l; ++i ) {
		r[i] = start++;
	}

	return r;

}

function search( word, maxCost, trie ) {
	var results = [],
	currentRow = range( word.length + 1 );


	for( var letter in trie.children ) {
		searchRecursive(
			trie.children[letter], letter, word, currentRow, results, maxCost
		);
	}

	return results;
}


function searchRecursive( node, letter, word, previousRow, results, maxCost ) {
	var columns = word.length + 1,
	currentRow = [previousRow[0] + 1],
	i, insertCost, deleteCost, replaceCost, last;

	for( i = 1; i < columns; ++i ) {

		insertCost = currentRow[i-1] + 1;
		deleteCost = previousRow[i] + 1;

		if( word.charAt( i-1 ) !== letter ) {
			replaceCost = previousRow[i-1]+1;

		}
		else {
			replaceCost = previousRow[i-1];
		}

		currentRow.push( Math.min( insertCost, deleteCost, replaceCost ) );
	}

	last = currentRow[currentRow.length-1];
	if( last <= maxCost && node.word !== null ) {
		results.push( [node.word, last] );
	}

	if( Math.min.apply( Math, currentRow ) <= maxCost ) {
		for( letter in node.children ) {
			searchRecursive(
				node.children[letter], letter, word, currentRow,
				results, maxCost
			);
		}
	}
}

return SuggestionDictionary;
}());
bot.commandDictionary = new SuggestionDictionary( 3 );

}());
