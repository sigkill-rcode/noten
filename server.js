var fs = require("fs");
var WebSocketServer = require("ws").Server;
var ServerSession = require("./server_session").ServerSession;

var animals;
var adjectives;

fs.readFile("animals.lst", "Utf-8", function(e, d)
	{
		if(e) throw e;
		animals = d.split("\n");
	});

fs.readFile("adjectives.lst", "Utf-8", function(e, d)
	{
		if(e) throw e;
		adjectives = d.split("\n");
	});

function get_name()
{
	return adjectives[Math.floor(adjectives.length * Math.random())] +
		" " + animals[Math.floor(animals.length * Math.random())];
}

function get_onclose_handler(id)
{
	return function(e){ console.log("%d disconnected", id); delete clients[id]; };
}

var server = new WebSocketServer({port: 4174});

var clients = {};
var client_id_counter = 0;
var unmatched_clients = {};

server.on("connection", function(sock)
	{
		var client = clients[client_id_counter] =
			new ServerSession(client_id_counter, sock, get_name());
		sock.on("close", get_onclose_handler(client_id_counter));

		client_id_counter ++;

		sock.on("message", function(message)
			{
		    	console.log("received: %s", message);
		    	sendAll(message);
			});

		console.log("Connected: (%d, %s)", client.id, client.name);
		sendAll("NEW USER JOINED: " + client.name);
	});
