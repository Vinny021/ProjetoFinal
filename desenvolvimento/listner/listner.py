import stomp
import json
import requests
from flask import Flask, request

app = Flask(__name__)
backendUrl = 'http://localhost:3000'

def tryConnect(conn, idInicial):
    try:
        branchId = 'branchId'+str(idInicial)
        conn.connect('admin', 'admin', wait=True, headers={'client-id': branchId})
        print('criado cliente com id ', branchId)
        return branchId
    except:
        print("ID "+ str(branchId)+" já existe" )
        return ''

class BranchListener(stomp.ConnectionListener):
    def __init__(self, branchId):
        self.branchId = branchId

    def on_error(self, frame):
        print(frame)
        print('Received an error "%s"' % frame.body)

    def on_message(self, frame):
        body = json.loads(frame.body)

        print('\nReceived a message "%s"' % body)
        
        if(body['messageType'] == 'notification'):
            data = {"fileId": body["fileId"], "fileName": body["fileName"], "category": body["category"], "extension": body["extension"]}
            bodyString = json.dumps(data)
            body = json.loads(bodyString)

            req = requests.post(backendUrl+'/insertFileInDNS', json=body)
            print("Chamada Backend para criar registro")
        elif(body['messageType'] == 'request'):
            
            destination = '{backendUrl}/transferFile'.format(backendUrl=backendUrl)
            
            data = {"fileId": body['fileId'], "ip": body["ip"], "port": body["port"]} 
            bodyString = json.dumps(data)
            body = json.loads(bodyString)

            req = requests.post(destination, json=body)
            print("Chamada ao Backend de quem possui para ser feita a transferência")
            


ActiveMQIP = '127.0.0.1'
PORT = 61613

conn = stomp.Connection([(ActiveMQIP, PORT)])

branchId = ''
idInicial = 1

while(len(branchId) == 0):
    branchId = tryConnect(conn, idInicial)
    idInicial += 1

print("Branch ID: ", branchId)

conn.set_listener(str(branchId), BranchListener(branchId))

topicString = '/topic/movie'
idTopic = branchId+topicString
conn.subscribe(topicString, id=idTopic)

@app.route('/newFile', methods=['GET', 'POST']) 
def notifyNewFile():
    print('entrou') 
    
    bytesBody = request.data 

    bodyString = bytesBody.decode("utf-8")

    body = json.loads(bodyString)
    print(body)


    data = {
        "messageType": "notification", 
        "fileId": body["fileId"], 
        "fileName": body["fileName"], 
        "category": body["category"], 
        "extension": body["extension"]
    }
    sendData = json.dumps(data)

    queueString = '/queue/' + data['fileId']
    idToSubscribe = branchId+queueString
    conn.subscribe(queueString, id=idToSubscribe)

    conn.send(body=''.join(sendData), destination='/topic/' + body["category"])

    return {200: 'OK'} 

@app.route('/requestFile', methods=['GET', 'POST']) 
def requestFile():
    bytesBody = request.data 

    bodyString = bytesBody.decode("utf-8")

    body = json.loads(bodyString) 
    
    data = {"messageType": "request", "fileId": body["fileId"], "ip": body["ip"], "port": body["port"]}
    sendData = json.dumps(data)

    queueString = '/queue/' + data['fileId']

    conn.send(body=''.join(sendData), destination=queueString)

    return {200: 'OK'}

@app.route('/deleteFile', methods=['GET', 'POST']) 
def delteFile():
    topicToUnsub = branchId+'/queue/123'
    conn.unsubscribe(topicToUnsub)
    return 'Deletado'
