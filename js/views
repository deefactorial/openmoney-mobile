{
    "views":{
    "account_balance":{
        "map":"function(doc, meta) { if (meta.id.substring(0,5) != \"_sync\" && doc.type == \"trading_name_journal\" && doc.from && doc.to && typeof doc.amount != 'undefined' && parseFloat(doc.amount) >= 0 && doc.currency && doc.timestamp) { if (typeof doc.verified != 'undefined' && doc.verified === true) { emit( \"trading_name,\" + doc.from + \",\" + doc.currency, -doc.amount ); emit( \"trading_name,\" + doc.to + \",\" + doc.currency, doc.amount ); } } }"
        }
    }
}
