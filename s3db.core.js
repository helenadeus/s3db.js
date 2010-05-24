s3db = { 'core' :
			{
				entities : {U:'user',P:'project',C:'collection',R:'rule',I:'item',S:'statement'},
				ids : {U:'user_id',P:'project_id',C:'collection_id',R:'rule_id',I:'item_id',S:'statement_id'},
				inherits : {P:["C","R"],C:["I","R"],R:"S",I:"S"},
				prev : {P:["U"], R:["P", "C", "I", "C"],C:["P"],I:["C"],S:["R", "I", "I"]},
				prev_id : {P:["user_id"], R:["project_id", "subject_id", "verb_id", "object_id"],C:["project_id"],I:["collection_id"],S:["rule_id","item_id","value"]},
				boxes : {U:'users',P:'projects',C:'collections',R:'rules',I:'items',S:'statements'},
				labels : {U:['username'],P:['name'],C:['name'],R:['subject', 'verb', 'object'],I:['notes'],S:['value']},
				uid_total_threadsLong : {'P':1,'C':1,'R':4,'I':1,'S':6},
				uid_total_threadsShort :  {'P':1,'C':1,'R':3,'I':1,'S':4}
			}
};

if(self.GET){
	s3db.url = GET.url;
	s3db.key = GET.key;
}
        