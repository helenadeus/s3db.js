if(!self.get) include('get.js', 's3db_math');
if(!self.s3dbcall) include('s3dbcall.js', 's3dbcall');
//if(!self.S3QLtranslator) include('s3ql_translator.js','s3db_math');
var s3dbUsers = {1:'Admin'};
var missingSlots = [];var missingSlotIDS= [];
var s3dbRules = [];
var s3dbCollections = []; var collectionsCalled = false;
var s3dbVerbs = [];var s3dbVerbID = false; var predicatedCalled = false;
$(document).ready(function(){
  get();
  if(!GET['url']) { GET['url'] = "http://localhost/s3db"; }
  if(!GET['key']) { GET['key'] = ""; }
  if(!GET['project_id']) { GET['project_id'] = "167222"; }
     
  var q = S3QLtranslator("R|P"+GET['project_id']);
  var url2call = GET['url']+"/S3QL.php?key="+GET['key']+"&query="+q+"&format=json";
  
  $.getJSON(url2call+'&callback=?', ruleInpector);

})

function ruleInpector(rules) {
	
	s3dbRules = rules;
	//This should be placed on top
	
	$(document.createElement('div')).attr('align', 'center').attr('style', 'background-color: #99CCFF; ').html('Rule Inspector').appendTo("body");
	$(document.createElement('div')).attr('align', 'left').html('Available Rules: '+rules.length).appendTo("body");

	//Then comes the rules
	$(document.createElement('table')).attr('class','tablesorter').attr('id', 'table_rules').appendTo("body");
	var thead = $(document.createElement('thead'));
	$('#table_rules').append(thead);
	var thtr = $(document.createElement('tr')).attr('id', 'table_rules_head').appendTo(thead);
	var col_heads = ['rule_id', 'subject', 'predicate','object', 'validation', 'notes','created_on', 'created_by','action'];
	for (var i=0; i<col_heads.length; i++) {
		$(document.createElement('th')).attr('id', 'col_head_'+col_heads[i]).attr('scope','column').html(col_heads[i]).appendTo(thtr);
	}
	var tbody = $(document.createElement('tbody'));
	$('#table_rules').append(tbody);
	if(typeof(rules.error_code)==='undefined')
	for (var i=0; i<rules.length; i++) {
		var classColor = ((i%2)?'even':'odd');
		var tbtr = $(document.createElement('tr')).attr('id', 'table_rules_'+rules[i].rule_id).attr('class', classColor).appendTo(tbody);
		var coldata = {'rule_id':rules[i].rule_id, 'subject':rules[i].subject+' <FONT SIZE="1px">(C'+rules[i].subject_id+')</FONT>', 'predicate':rules[i].verb+' <font size="1px">(I'+rules[i].verb_id+')</FONT>', 'object':rules[i].object+((rules[i].object_id!='')?' <FONT SIZE="1px">(C'+rules[i].object_id+')</FONT>':''), 'created_on':rules[i].created_on.substring(0, 10), 
		'validation':rules[i].validation,
		'notes':rules[i].notes,
		'action':((rules[i].change)?'<a href="javascript:s3db_delete('+rules[i].rule_id+', "R")">Edit</a>&nbsp;&nbsp;&nbsp;<a href="javascript:s3db_delete('+rules[i].rule_id+', "R")">Delete</a>':'')
			
		};
		
		for (var j=0; j<col_heads.length; j++) {
			
			var tdOrTh = (col_heads[j]==='rule_id')?'td':'td';
			if (col_heads[j]==='created_by') {
				//if the data is not ready, don't put anything in html
				$(document.createElement(tdOrTh)).attr('id','td_'+col_heads[j]+'_'+rules[i].rule_id).appendTo(tbtr);
				
				$('#td_'+col_heads[j]+'_'+rules[i].rule_id).html(user(rules[i].created_by, 'td_'+col_heads[j]+'_'+rules[i].rule_id));
				
			}
			else {
				var id = 'td_'+col_heads[j]+'_'+rules[i].rule_id;
				$(document.createElement(tdOrTh)).attr('id',id).appendTo(tbtr);
				if(coldata[col_heads[j]]) {
					$('#'+id).html(coldata[col_heads[j]]);
				}
			}
		}
	}
	
	
	$('#table_rules').tablesorter(); 
	
	//And now we add a table to create a new rule
	newRuleTable();
	
	
}

function newRuleTable() {
	
	$(document.createElement('div')).attr('align', 'center').attr('style', 'background-color: #99CCFF; ').html('Create New Rule').appendTo("body");
	$(document.createElement('table')).attr('class', 'new').attr('id', 'table_new_rules').appendTo("body");
	var thead = $(document.createElement('thead'));
	$('#table_new_rules').append(thead);
	var thtr = $(document.createElement('tr')).attr('id', 'table_rules_head').appendTo(thead);
	
	var tbody = $(document.createElement('tbody')).appendTo($('#table_new_rules'));
	var inputTr = $(document.createElement('tr')).appendTo(tbody);
	var col_heads = ['rule_id', 'subject', 'predicate','object', 'created_on', 'created_by','action'];
	
	// now create the input fields for adding stuff
	var input = { 
				'rule_id' : '',
				'subject' : $(document.createElement('select')).attr('id', 'subject_select'),
				'predicate' : $(document.createElement('select')).attr('id', 'predicate_select'),
				'object' : $(document.createElement('select')).attr('id', 'object_select'),
				'created_on' : '',
				'created_by' : '',
				'action' : ''
				};

	for (var i=0; i<col_heads.length; i++) {
		var required = (col_heads[i].match(/subject|predicate|object/))?'<sup>*</sup>':'';
		$(document.createElement('th')).attr('id', 'col_head_'+col_heads[i]).html(col_heads[i]+required).appendTo(thtr);
		$(document.createElement('th')).attr('id', col_heads[i]+'_input').append(input[col_heads[i]]).appendTo(inputTr);
	}
	
	
	//get the collections, can't get them from the rules since some of the collections may not have them yet; as the collections come along, they will be filling the select with options, therefore i can add the select at this point
	$('#collection_select').append('<img src="loading.gif">');
	$('#object_select').append('<img src="loading.gif">');
	$('#predicate_select').append('<img src="loading.gif">');
	search_collection(GET['project_id'], ['subject_select', 'object_select']);
	//search_predicate(s3dbVerbID); this guy is being search right after retrtieving collection s3dbVerb
	
	
	

	
	
}

function search_collection(project_id, select_holder) {
	if(typeof(select_holder)=='string'){
		var select_holder = [select_holder];
	}
	if(s3dbCollections.length==0 && !collectionsCalled){
		if(typeof(project_id)!=='undefined'){
		  var q = S3QLtranslator('C|P'+project_id);
		  
		}
		else {
		   var q = S3QLtranslator('C');
		}
		
		var url2call = GET['url']+"/S3QL.php?key="+GET['key']+"&query="+q+"&format=json";
		  // s3dbcall(url,"result=ans;alert(':-)')","result=0;alert(':-(')");
		  $.getJSON(url2call+'&callback=?', function (collections) {
			collectionsCalled = true;
			s3dbCollections = collections;
			
			//as the collections come along, fill out the options on collection_select
			for (var s=0; s<select_holder.length; s++) {
				$('#'+select_holder[s]).html('');
				appendToSelect(collections, select_holder[s]);
			}
			
			
			//search_collection(GET['project_id'], 'object_select'); // this guy is not really doing any search, just using the collection already existing... unless there is a request to link to any other project collection
		  });
	}
	else {
		for (var s=0; s<select_holder.length; s++) {
				appendToSelect(collections, select_holder[s]);
			}
	}
}

function appendToSelect(data, select_holder) {
	for (var i=0; i<data.length; i++) {
				if(data[i].name=='s3dbVerb') { 
					s3dbVerbID = data[i].collection_id; 
					if(!predicatedCalled)	search_predicate(s3dbVerbID); 
				}
				$(document.createElement('option')).attr('value', data[i].collection_id).html(data[i].name+' (C'+data[i].collection_id+')').appendTo($('#'+select_holder));
			}
}

function search_predicate(s3dbVerbID) {
	if(typeof(s3dbVerbID)==='undefined' && s3dbCollections.length>0){
		for (var i=0; i<s3dbCollections.length; i++) {
			if(collections[i].name=='s3dbVerb') { s3dbVerbID = collections[i].collection_id; }
		}
	}
	if(typeof(s3dbVerbID)!=='undefined'){
		var q = S3QLtranslator('I|C'+s3dbVerbID);
		var url2call = GET['url']+"/S3QL.php?key="+GET['key']+"&query="+q+"&format=json";
		   $.getJSON(url2call+'&callback=?', function (items) {
			s3dbVerbs = items;
			$('#predicate_select').html('');
			//as the collections come along, fill out the options on collection_select
			for (var i=0; i<items.length; i++) {
				if(items[i].notes!=='')
				$(document.createElement('option')).attr('value', items[i].item_id).html(items[i].notes+' (I'+items[i].item_id+')').appendTo($('#predicate_select'));
			}
			
		  });
	}
	

}

function user(id, userslot) {
	//finds the usernmae of an s3db user and saves it; the call trigger an event that fill out the user slot whenever it is available;
	var user_id = id;
   if(typeof(s3dbUsers[id])==='undefined'){
	   
	   $('#'+userslot).append('<img id="loading_'+userslot+'" src="loading.gif">');
	  
	   
	  //however, I need to make sure this query runs only once
	  if(missingSlots.length<=0){
		   var q = S3QLtranslator('U');
		   var url2call = GET['url']+"/S3QL.php?key="+GET['key']+"&query="+q+"&format=json";
		   // s3dbcall(url,"result=ans;alert(':-)')","result=0;alert(':-(')");
		   $.getJSON(url2call+'&callback=?', function (users) {
				for (var i=0; i<users.length; i++) {
					s3dbUsers[users[i].user_id] = users[i].username;
					
				}
				//once all the data are in
				for (var h=0; h<missingSlots.length; h++) {
					$('#'+missingSlots[h]).html(s3dbUsers[missingSlotIDS[h]]+'<font size="1px"> (U'+missingSlotIDS[h]+')</font>');
				}
								
				
		   });
	   }

	   //because the query should run only once, although this code will run many times, use this to indicate that certain slots are waiting for their value
	   missingSlots.push(userslot);
	   missingSlotIDS.push(id);
			
	
   }
   else {
		document.getElementById(userslot).innerHTML = s3dbUsers[user_id]+'<font size="1px"> (U'+user_id+')</font>';
   }

}

function s3db_edit(id, E) {
	console.log('edit '+rule_id);
}

function s3db_delete(id, E) {
	console.log('delete '+rule_id);
}

function include(src, path) {
	if(typeof(path)!=='undefined')
	{
		var pathTranslate = 
					{
					's3db' : 'http://js.s3db.googlecode.com/hg/',
					's3db_math' : 'http://s3db.mathbiol-lena.googlecode.com/hg/',
					'compstats': 'http://compstats.mathbiol-lena.googlecode.com/hg/',
					's3dbcall' : 'http://s3dbcall.googlecode.com/hg/'
					}
		var fullSrc = pathTranslate[path]+'/'+src;
	}
	else {
		var fullSrc = src;
	}
	

	try {
		document.write("<script type='text/javascript' src='"+fullSrc+"'</script>");
	}
	catch (err) {
		var fullSrc = path+'/'+src;
		document.write("<script type='text/javascript' src='"+fullSrc+"'</script>");
	}


}