var peer;
var conn;
/*
, {
		host: "localhost",
		port: 9000,
		path: "/myapp",
	}
*/

/**
 * Initializes peerjs identity and handles receiving data.
 * @param {string} authenticatorCode
 */
function initializePeerConnection(authenticatorCode) {
	peer = new Peer(authenticatorCode);
	insertStepFourB();
	logActivity(`Successfully established a P2P identity. Waiting for files...`);
	peer.on("connection", (conn) => {
		insertStepFourB();
		logActivity(`Incoming connection with peer ID: ${conn.peer}.`);
		conn.on("data", (encryptedMessage) => {
			insertStepFourB();
			logActivity(`Receiving data from peer ID: ${authenticatorCode}.`);
			fileReceiver(JSON.parse(encryptedMessage));
		});
	});
}

/**
 * Handles sending data to other peers.
 * @param {string} file
 */
function connectToPeer(file) {
	const conn = peer.connect(sessionStorage.getItem("user2"));
	logActivity(`Connection established with peer ID: ${conn.peer}.`);
	conn.on("open", () => {
		logActivity(`Sending file to peer ID: ${conn.peer}.`);
		conn.send(file);
		removeStepFourB();
	});
}
