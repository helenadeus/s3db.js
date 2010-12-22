quickTranslator = {
	queryParts : {},
	fullQuery : {},
	update : function (el, query, core) {
	if(typeof(core)=='undefined'){
		//alert('You need to define a variable named "core" as the name for your included core structure');
		var s3db = {
			name : 's3db',
			entities : ["deployment", "user", "project", "collection", "rule","item","statement"],
			entity_ids : {D:'deployment_id',U:'user_id',P:'project_id',C:'collection_id',R:'rule_id',I:'item_id',S:'statement_id'},
				
			relationships : {
				DP : {domain : 'deployment', range : 'project' },
				PC : {domain : 'project', range : 'collection' },
				PR : {domain : 'project', range : 'rule' },
				CI : {domain : 'collection', range : 'item' },
				Rsubject : {domain : 'collection', range : 'rule' },
				Robject : {domain : 'collection', range : 'rule' },
				Rpredicate : {domain : 'item', range : 'rule' },
				Ssubject : {domain : 'item', range : 'statement' },
				Sobject : {domain : 'item', range : 'statement' },
				Spredicate : {domain : 'rule', range : 'statement' },
				DU : {domain : 'deployment', range : 'user' },
				DU : {domain : 'user', range : 'user' }		
			},

			
			actions : ["select", "insert", "update", "delete" ],
			entitySymbols : { D :"deployment",  U :"user",  P:"project", C:"collection",R:"rule", I:"item", S:"statement"},
			globalAttributes : ["id", "label", "description", "created", "creator"],
			
			specificAttributes: {
				deployment: [],
				user : ['username','email'],
				project: [],
				collection: ["project_id"],
				rule: ["project_id", "subject_id", "verb_id", "object_id"],
				item: ["collection_id"],
				statement : ["item_id", "rule_id", "value"]
			
			}
		};
		quickTranslator.core = s3db;
	}
	else {
		quickTranslator.core = core;
	}
	//clean queryPars
	quickTranslator.queryParts = {action:'', target:'',params:{}};
	
	//start of by reading all that is before the first |
	//var entityNames = {"S":"statement", "R": "rule","C":"collection","I":"item","P":"project","U":"user","D":"deployment"};
	if(typeof(quickTranslator.core.entities)!=='undefined' && typeof(quickTranslator.core.entities)=='object'){
		var entityNames = quickTranslator.core.entities;
	}
	else {
		var entityNames = [];
	}
	
	var s3ql_query = "";
	
	var symbols = '';var ind=0; 
	$.each(quickTranslator.core.entitySymbols, function(index, value) { 
		//if(ind!==0) symbols += '|'; 
		symbols += index; ind++;
	} );
	//Detect any operation specification; separate components so that each can be trimmed
	var actions = ''; 
	$.each(quickTranslator.core.actions, function(index, value) {  
		if(index!==0)  actions += '|'; actions += value; 
	});
	var op = query.trim().match(actions);
	if(op) { 
		//found an action; fill out the field
		op = op[0].trim(); 
		quickTranslator.queryParts.action = op;		
		quickTranslator.quickUpdate(el);
	}
	//try to find a target
	//var target = query.replace(op,"").trim().match(/\((^|)\|/);
	target = query.trim().match(/\(([^|]+)(\||\))/);
	if(target){
		quickTranslator.queryParts.template='';
		//now, lefts figure our 1) the target entity name and 2) if there is a template
		var symb = target[1].trim().match('^(['+symbols+'])');
		if(symb){
			symb = symb[1];
			var entity = quickTranslator.core.entitySymbols[symb];
			quickTranslator.queryParts.target = entity;		
			quickTranslator.quickUpdate(el);
		}
		
		var temp = target[1].trim().match(symb+'\.[^\||\)]+');
		if(temp){
			var template = temp[0].split(',');
			var search = '';
			if(template){
				for (var i=0; i<template.length; i++) {
					if(template[i]!=='' && template[i].trim()!==target){
						search += template[i].trim().replace(symb+'\.','');
						if(i!==template.length-1){
							search += ',';
						}

					}
				}
			}
			quickTranslator.queryParts.template = search;	
		}
		//console.log('invalid query - parameters are required to be inside parenthesis');
		//return false;
	}
	
	//what goes in as input parameters
	var params = query.trim().match(/\|([^\)]+)\)/)
	
	//Detect if there is more than 1 paramenter
	
	if(params){
		quickTranslator.queryParts.params = {};
		params = params[1].trim();
		var p = params.split(",");
		for (var i=0; i<p.length; i++) {
			 var pi = p[i].trim();
			 var attrValue = pi.match(/(.*)=(.*)/);
			 if(attrValue){
				var attr = attrValue[1].trim();
				var value = attrValue[2].trim();
				if(attr && value){
					if(quickTranslator.core.entitySymbols[attr]) {attr =quickTranslator.core.entity_ids[attr];}
					
				}
				
			 }
			 else if (pi.match('['+symbols+'](.*)')) {
					
					letterSymbol = pi.match('('+symbols+')([0-9]+| (.+))');
					if(typeof(quickTranslator.core.name)!=='undefined' && quickTranslator.core.name=='s3db'){
						var uid_info = uid_resolve(pi);
					}
					else {
						uid_info = {'letter' : letterSymbol[1], 's3_id': letterSymbol[2] }
					}
					
					attr = quickTranslator.core.entity_ids[uid_info['letter']];
					value = uid_info['s3_id'];
					
			}
			if(typeof(attr)!=='undefined'){
				quickTranslator.queryParts.params[attr] = value;
			}
			
		}
	quickTranslator.quickUpdate(el);	
	}
	
	
	},
	quickUpdate : function (el) {
		//action
		var paramStr = ''; 
		var actionString = '';

		if(typeof(quickTranslator.queryParts.action)=='undefined'){
			quickTranslator.queryParts.action = 'select';
		}
		if(typeof(quickTranslator.queryParts.action)!=='undefined'){
				var app = '';
				var val = quickTranslator.queryParts.action;
				if(quickTranslator.queryParts.action=='select'){
					if(typeof(quickTranslator.queryParts.template)=='undefined' || quickTranslator.queryParts.template==''){
						var ins = '*';
					}
					else {
						var ins = quickTranslator.queryParts.template;
					}
					
					if(typeof(quickTranslator.queryParts.target)!=='undefined'){
						app = '<from>'+quickTranslator.queryParts.target+'</from>';
					}
					
				}
				else {
					if(typeof(quickTranslator.queryParts.target)!=='undefined'){
						var ins = quickTranslator.queryParts.target;
					}
					else {
						var ins = '';
					}
				}
				actionString = '<'+val+'>'+ins+'</'+val+'>'+app;
				quickTranslator.fullQuery.actionString = actionString;
		}
		if(typeof(quickTranslator.queryParts.params)!=='undefined'){
			paramStr += '<where>';
			for (var attr in quickTranslator.queryParts.params) {
				if(typeof(attr)!=='undefined'){
					var val = quickTranslator.queryParts.params[attr];
					paramStr += '<'+attr+'>'+val+'</'+attr+'>';
				}
			}
			paramStr += '</where>';
			quickTranslator.fullQuery.paramString = paramStr;
		}
		var s3qlstr = '<S3QL>'+actionString+paramStr+'</S3QL>';
		quickTranslator.fullQuery.finale = s3qlstr;
		$('#'+el).html(s3qlstr);
	}
	
}

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

function uid_resolve(uid){
	// //#Valid UID rules
	//# 1.  Individual non-D entities must be preceded by a D entity 
	//# 2. D entities must always resolve to a URL
	//# 3. Entities are separated by #
	//# 4. Entities start with D U P C I R S
	//# 5. Entities must appear according to their order in the core model:
	//# a. P cannot be preceded by C,R,I,S
	//# b. C cannot be preceded by I,R
	//# c. R cannot be preceded by S
	//# d. I cannot be preceded by S
	// A uid may start with a URL, but subsequent Did in the uid string must correspond to the alphanumeric version of the Did uri (why? is this rule really necessary)?
	
		//find all the D
		 var uid_info = {};
		 var tmp1 = uid.match(/([D|(http)][^D]+)/g); // find all D followed by non-D
		 var tmp2 = uid.match(/([D|U|P|C|R|S|I])(\d+)$/);
		
		 var dUIDS = [];
		 //the did is the last one found, if any; no mothership unless there is a Did
		 if(tmp1!==null && typeof(tmp1[1])!=='undefined'){
			tmp4 = tmp1[1].match(/(D\d+|http[^D|P|U|C|R|I|S]+)/);
			uid_info['did'] = tmp4[1];//now find the LAST of the uid, if there are many
			var tmp3 = uid.match(/^(http.+)\/|^(D\d+)/);
		 }
		 else {
			uid_info['did'] = 'local';
		 }
		if(typeof(tmp3)!=='undefined' && tmp3!==null){
			 uid_info['ms'] = tmp3[0];
		}
		else {
			 uid_info['ms'] = 'http://root.s3db.org/';
		}
		 
		 //now resolve only the uid part
		 if(tmp2 && tmp2[1] && tmp2[2]){
			uid_info['origin'] = uid;
			uid_info['letter'] = tmp2[1];
			uid_info['uid'] = tmp2[0];
			uid_info['s3_id'] = tmp2[2];
		 }
		
			
		 
		 
	return uid_info;
}


s3ql2sparql = {
	s3qlObj : {},
	getCore : function (core) {
		if(typeof(core)=='undefined'){
			//alert('You need to define a variable named "core" as the name for your included core structure');
			var s3db = {
				name : 's3db',
				entities : ["deployment", "user", "project", "collection", "rule","item","statement"],
				entity_ids : {D:'deployment_id',U:'user_id',P:'project_id',C:'collection_id',R:'rule_id',I:'item_id',S:'statement_id'},
					
				relationships : {
					DP : {domain : 'deployment', range : 'project' },
					PC : {domain : 'project', range : 'collection' },
					PR : {domain : 'project', range : 'rule' },
					CI : {domain : 'collection', range : 'item' },
					Rsubject : {domain : 'collection', range : 'rule' },
					Robject : {domain : 'collection', range : 'rule' },
					Rpredicate : {domain : 'item', range : 'rule' },
					Ssubject : {domain : 'item', range : 'statement' },
					Sobject : {domain : 'item', range : 'statement' },
					Spredicate : {domain : 'rule', range : 'statement' },
					DU : {domain : 'deployment', range : 'user' },
					DU : {domain : 'user', range : 'user' }		
				},

				
				actions : ["select", "insert", "update", "delete" ],
				entitySymbols : { D :"deployment",  U :"user",  P:"project", C:"collection",R:"rule", I:"item", S:"statement"},
				globalAttributes : ["id", "label", "description", "created", "creator"],
				
				specificAttributes: {
					deployment: [],
					user : ['username','email'],
					project: [],
					collection: ["project_id"],
					rule: ["project_id", "subject_id", "verb_id", "object_id"],
					item: ["collection_id"],
					statement : ["item_id", "rule_id", "value"]
				
				}
			};
			
			s3ql2sparql.core = s3db;
			
		}
		else {
			s3ql2sparql.core = core;
		}

	},
	parse : function(q) {
		//read the query from xml format
			s3ql2sparql.s3qlObj = {action:'', params: {}, target: {}};
			if($(q).find('select').length>0)
				{ 
				s3ql2sparql.s3qlObj.action = 'select'; 
				s3ql2sparql.s3qlObj.template = $(q).find('select').text();
				if($(q).find('from')){
					s3ql2sparql.s3qlObj.target = $(q).find('from').text();
				}
			}
			else if ($(q).find('update').length>0) {
				 s3ql2sparql.s3qlObj.action = 'update'; 
				 s3ql2sparql.s3qlObj.target = $(q).find('update').text();
			}
			else if ($(q).find('insert').length>0) {
				 s3ql2sparql.s3qlObj.action = 'insert'; 
				 s3ql2sparql.s3qlObj.target = $(q).find('insert').text();
			}
			else if ($(q).find('delete').length>0) {
				 s3ql2sparql.s3qlObj.action = 'delete'; 
				 s3ql2sparql.s3qlObj.target = $(q).find('delete').text();
			}
			$(q).find('where').each( 
				function () {
					
					$(this).children().each(
						function () {
							var attr = $(this)[0].nodeName.toLowerCase();
							var val = $(this).text();
							s3ql2sparql.s3qlObj.params[attr] = val;
						}
					);
				});

			
		
	},
	toSparql : function (query, el,core) {
		if(typeof(el)==='undefined') var el = 's';
		if($('#'+el).length==0) { $(document.createElement('div')).attr('id','s').appendTo('body');}
			
		//parse the xml in the query
		s3ql2sparql.getCore(core);
		s3ql2sparql.parse(query);
		
		
		//first part of sparql will be the prefiex; i'd like to paint them in a lighter color, indicating they are not very imp
		s3ql2sparql.sparql = '';
		//var prefixes = 
		//	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX s3db: <http://www.s3db.org/core#>\nPREFIX : < type here the URL of your S3DB deployment>';
		var prefixes = 	'PREFIX : <type here the URL of S3DB>';
		
		s3ql2sparql.defaultns = ':';
		s3ql2sparql.s3dbns = 's3db:';
		s3ql2sparql.rdfns = 'rdf:';
		s3ql2sparql.rdfsns = 'rdfs:';

		//can we detect a subject?
		//for item or collection, the subject will be the itme or collection; for statmetns and rules, because they are triples, it will be items and collections... does this make any sense? well... for now I will make it only for rules and statements; will thnkik about C and I later
		if(s3ql2sparql.s3qlObj.action==='select' && s3ql2sparql.s3qlObj.target!==""){
			switch (s3ql2sparql.s3qlObj.target) {
			case 'rule':

							
				s3ql2sparql.subject = s3ql2sparql.guessValue('C', 'subject_id');
				s3ql2sparql.predicate = s3ql2sparql.guessValue('I', 'verb_id');
				//now the object is tricky; it can either work with another item, or with a value; 
				if(typeof(s3ql2sparql.s3qlObj.params['object_id'])!=='undefined')
				{	s3ql2sparql.object = s3ql2sparql.guessValue('C', 'object_id');}
				else {
					s3ql2sparql.object = s3ql2sparql.guessValue('C', 'object');
				}
				
				break;
			case 'statement':
				
				//do we know the uid of subject type?
				s3ql2sparql.subjectEntitySymb = 'I';
				s3ql2sparql.subjectEntityID = 'item_id';
				
				s3ql2sparql.subject = s3ql2sparql.guessValueFromCore('I');
				s3ql2sparql.predicate = s3ql2sparql.guessValueFromCore('R');
				//now the object is tricky; it can either work with another item, or with a value; 
				s3ql2sparql.object = s3ql2sparql.guessValue('I', 'value');
							
				break;
			}
			
				
			s3ql2sparql.terse = s3ql2sparql.subject+'\t'+s3ql2sparql.predicate+'\t'+s3ql2sparql.object+'\t.';
		}
		else if(s3ql2sparql.s3qlObj.target!=="") {
			//non convertible
			s3ql2sparql.terse =  '';
		}
		else {
			$('#'+el).html("");
			return false;
		}
		
		s3ql2sparql.sparql = prefixes+'\n\n';
		s3ql2sparql.sparql += 'SELECT * WHERE {\n';
		s3ql2sparql.sparql += s3ql2sparql.terse;
		s3ql2sparql.sparql += '\n}';
		$('#'+el).html(s3ql2sparql.sparql);
		return (s3ql2sparql.sparql);
		
		
	},

	guessValue : function (altCoreSymb, param) {
		if(typeof(s3ql2sparql.s3qlObj.params[param])=='undefined'){
			 var guessSyntax = '?'+param;
		}
		else {
			if(!isNaN(parseFloat(s3ql2sparql.s3qlObj.params[param])) && typeof(altCoreSymb)!=='undefined') //true if numeric
				{
					var guessSyntax = s3ql2sparql.guessValueFromCore(altCoreSymb, param);
				}
			else {
				var guessSyntax = '"'+s3ql2sparql.s3qlObj.params[param]+'"';
			}
		}
		return guessSyntax;

	},
	guessValueFromCore : function(symb, par) {
		
		var entity = s3ql2sparql.core.entitySymbols[symb];	
		var id = s3ql2sparql.core.entity_ids[symb];
		
		//to support alternatives
		if(typeof(par)!=='undefined') id = par;

		if(typeof(s3ql2sparql.s3qlObj.params[id])=='undefined'){
			
			//i will figure out later if I want to fetch the rule to make to informed guesses about the variable names; for now, I'll jus use ?item
			 var guessSyntax = '?'+id;
		}
		else {
			
		
			//great, what would it be defined as?
			//check if numeric
			if(!isNaN(parseFloat(s3ql2sparql.s3qlObj.params[id]))) 
				var varVal = symb+s3ql2sparql.s3qlObj.params[id];
			else {
				var varVal = s3ql2sparql.s3qlObj.params[id];
			}
			//var itemInfo = uid_resolve(item);			
		
			if(s3ql2sparql.s3qlObj.params[id].match('^'+symb)){
				var fixedSubj = s3ql2sparql.defaultns+s3ql2sparql.s3qlObj.params[id];
			}
			else if (s3ql2sparql.s3qlObj.params[id].match('^http')) {
				var fixedSubj = '<'+s3ql2sparql.s3qlObj.params[id]+'>';
			}
			else {
				var fixedSubj = s3ql2sparql.defaultns+symb+s3ql2sparql.s3qlObj.params[id];
			}
			var guessSyntax = fixedSubj;
		}			
	return guessSyntax;
	}


}

