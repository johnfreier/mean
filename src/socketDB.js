var net = require('net');

var tcpServer = net.createServer(function(client) {

	// Identify this client
	client.name = client.remoteAddress + ":" + client.remotePort 

	// Send to a client
	client.write('Echo server\r\n');

	// Received data
	client.on('data', function(data) {
		console.log('received:' + data);
	});
});

tcpServer.listen(8080);
