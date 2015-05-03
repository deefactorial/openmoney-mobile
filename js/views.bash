#execute from server
curl -X PUT -H "Content-type: application/json" https://localhost:4985/openmoney_shadow/_design/dev_rest --data @views
#test:
curl https://localhost:4985/openmoney_shadow/_design/dev_rest/_view/account_balance
