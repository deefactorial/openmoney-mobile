#execute from server
curl -X PUT -H "Content-type: application/json" https://cloud.openmoney.cc:4985/openmoney_shadow/_design/dev_rest --data @view
#test:
http -a deefactorial@gmail.com https://cloud.openmoney.cc:4984/openmoney_shadow/_design/dev_rest/_view/account_balance
