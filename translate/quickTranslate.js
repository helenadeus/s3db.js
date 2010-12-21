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
		core = s3db;
	}
	//clean queryPars
	quickTranslator.queryParts = {action:'', target:'',params:{}};
	
	//start of by reading all that is before the first |
	//var entityNames = {"S":"statement", "R": "rule","C":"collection","I":"item","P":"project","U":"user","D":"deployment"};
	if(typeof(core.entities)!=='undefined' && typeof(core.entities)=='object'){
		var entityNames = core.entities;
	}
	else {
		var entityNames = [];
	}
	
	var s3ql_query = "";
	
	var symbols = '';var ind=0; 
	$.each(core.entitySymbols, function(index, value) { 
		//if(ind!==0) symbols += '|'; 
		symbols += index; ind++;
	} );
	//Detect any operation specification; separate components so that each can be trimmed
	var actions = ''; 
	$.each(core.actions, function(index, value) {  
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
			var entity = core.entitySymbols[symb];
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
					if(core.entitySymbols[attr]) {attr =core.entity_ids[attr];}
					
				}
				
			 }
			 else if (pi.match('['+symbols+'](.*)')) {
					
					letterSymbol = pi.match('('+symbols+')([0-9]+| (.+))');
					if(typeof(core.name)!=='undefined' && core.name=='s3db'){
						var uid_info = uid_resolve(pi);
					}
					else {
						uid_info = {'letter' : letterSymbol[1], 's3_id': letterSymbol[2] }
					}
					
					attr = core.entity_ids[uid_info['letter']];
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

