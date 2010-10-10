querycore({
	"name":"skos",
	"entities":["Concept", "ConceptScheme", "Collection"],
				
	"relationships":{
		"prefLabel":{ "domain":"Concept" },
		"altLabel":{ "domain":"Concept" },
		"narrower":{ "domain":"Concept" , "range":"Concept" },
		"broader":{ "domain":"Concept" , "range":"Concept" },
		"related":{ "domain":"Concept" , "range":"Concept" },
		"scopeNote":{ "domain":"Concept" },
		"definition":{ "domain":"Concept" },
		"example":{ "domain":"Concept" },
		"historyNote":{ "domain":"Concept" },
		"editorialNote":{ "domain":"Concept" },
		"changeNote ":{ "domain":"Concept" },
		"inScheme":{ "domain":"Concept", "range":"ConceptScheme"},
		"hasTopConcept":{ "domain":"ConceptScheme", "range":"Concept"},
		"broadMatch":{ "domain":"Concept" , "range":"Concept" },
		"relatedMatch":{ "domain":"Concept" , "range":"Concept" },
		"exactMatch":{ "domain":"Concept" , "range":"Concept" },
		"member":{ "domain":"Collection" , "range":"Concept" }
	},
	
	"actions":["select", "insert", "update", "delete", "define" ],
	"entitySymbols":{ "C" :"Concept", "CS":"ConceptScheme", "CO":"Collection" },
	"entity_ids" : { "C" :"Concept", "CS":"ConceptScheme", "CO":"Collection"},
	"globalAttributes":["prefLabel", "altLabel", "scopeNote", "definition"]
	
})