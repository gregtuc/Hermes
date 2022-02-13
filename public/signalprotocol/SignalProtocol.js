"use strict";

var SignalServer;
var signalProtocolManagerUser;

/**
 * Signal server connector.
 * Connects to signal server for storing and fetching user public keys over HTTP.
 */
class SignalServerStore {
	constructor() {
		this.store = {};
		this.xhttp = new XMLHttpRequest();
	}

	/**
	 * When a user logs on they should generate their keys and then register them with the server.
	 *
	 * @param userId The user ID.
	 * @param preKeyBundle The user's generated pre-key bundle.
	 */
	async registerNewPreKeyBundle(userId, preKeyBundle) {
		return new Promise((resolve, reject) => {
			//Register the key with the server
			var xhttp = new XMLHttpRequest();
			var data = JSON.stringify({
				identityKey: util.toString(preKeyBundle.identityKey),
				preKeys: {
					keyId: preKeyBundle.preKey.keyId,
					publicKey: util.toString(preKeyBundle.preKey.publicKey),
				},
				registrationId: preKeyBundle.registrationId,
				signedPreKey: {
					keyId: preKeyBundle.signedPreKey.keyId,
					publicKey: util.toString(preKeyBundle.signedPreKey.publicKey),
					signature: util.toString(preKeyBundle.signedPreKey.signature),
				},
			});
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					resolve();
				}
			};
			xhttp.open(
				"POST",
				`${serverUrl}/registerNewPreKeyBundle/${userId}`,
				true
			);
			xhttp.setRequestHeader("Content-type", "application/json");
			xhttp.send(data);
			//Register the key locally
			this.store[userId] = preKeyBundle;
		});
	}

	/**
	 * Gets the pre-key bundle for the given user ID.
	 * If you want to start a conversation with a user, you need to fetch their pre-key bundle first.
	 *
	 * @param userId The ID of the user.
	 */
	async getPreKeyBundle(userId) {
		return new Promise((resolve, reject) => {
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					var data = JSON.parse(this.responseText);
					if (data) {
						resolve(util.preKeyBundleStringToArrayBuffer(data));
					} else {
						resolve();
					}
				}
			};
			xhttp.open("POST", `${serverUrl}/getPreKeyBundle`, true);
			xhttp.setRequestHeader("Content-type", "application/json");
			xhttp.send(
				JSON.stringify({
					userId: userId,
				})
			);
		});
	}
}

/**
 * A signal protocol manager.
 */
class SignalProtocolManager {
	constructor(userId, signalServerStore) {
		this.userId = userId;
		this.store = new SignalProtocolStore();
		this.signalServerStore = signalServerStore;
	}

	/**
	 * Initialize the manager when the user logs on.
	 */
	async initializeAsync() {
		await this._generateIdentityAsync();

		var preKeyBundle = await this._generatePreKeyBundleAsync(123, 456);

		await this.signalServerStore.registerNewPreKeyBundle(
			this.userId,
			preKeyBundle
		);
	}

	/**
	 * Encrypt a message for a given user.
	 *
	 * @param remoteUserId The recipient user ID.
	 * @param message The message to send.
	 */
	async encryptMessageAsync(remoteUserId, message) {
		var sessionCipher = this.store.loadSessionCipher(remoteUserId);

		if (sessionCipher == null) {
			var address = new libsignal.SignalProtocolAddress(remoteUserId, 123);
			var sessionBuilder = new libsignal.SessionBuilder(this.store, address);

			var remoteUserPreKey = await this.signalServerStore.getPreKeyBundle(
				remoteUserId
			);
			await sessionBuilder.processPreKey(remoteUserPreKey);

			var sessionCipher = new libsignal.SessionCipher(this.store, address);
			this.store.storeSessionCipher(remoteUserId, sessionCipher);
		}

		var cipherText = await sessionCipher.encrypt(util.toArrayBuffer(message));

		return cipherText;
	}

	/**
	 * Decrypts a message from a given user.
	 *
	 * @param remoteUserId The user ID of the message sender.
	 * @param cipherText The encrypted message bundle. (This includes the encrypted message itself and accompanying metadata)
	 * @returns The decrypted message string.
	 */
	async decryptMessageAsync(remoteUserId, cipherText) {
		var sessionCipher = this.store.loadSessionCipher(remoteUserId);

		if (sessionCipher == null) {
			var address = new libsignal.SignalProtocolAddress(remoteUserId, 123);
			var sessionCipher = new libsignal.SessionCipher(this.store, address);
			this.store.storeSessionCipher(remoteUserId, sessionCipher);
		}

		var messageHasEmbeddedPreKeyBundle = cipherText.type == 3;

		if (messageHasEmbeddedPreKeyBundle) {
			var decryptedMessage = await sessionCipher.decryptPreKeyWhisperMessage(
				cipherText.body,
				"binary"
			);
			return util.toString(decryptedMessage);
		} else {
			var decryptedMessage = await sessionCipher.decryptWhisperMessage(
				cipherText.body,
				"binary"
			);
			return util.toString(decryptedMessage);
		}
	}

	/**
	 * Generates a new identity for the local user.
	 */
	async _generateIdentityAsync() {
		var results = await Promise.all([
			libsignal.KeyHelper.generateIdentityKeyPair(),
			libsignal.KeyHelper.generateRegistrationId(),
		]);

		this.store.put("identityKey", results[0]);
		this.store.put("registrationId", results[1]);
	}

	/**
	 * Generates a new pre-key bundle for the local user.
	 *
	 * @param preKeyId An ID for the pre-key.
	 * @param signedPreKeyId An ID for the signed pre-key.
	 * @returns A pre-key bundle.
	 */
	async _generatePreKeyBundleAsync(preKeyId, signedPreKeyId) {
		var result = await Promise.all([
			this.store.getIdentityKeyPair(),
			this.store.getLocalRegistrationId(),
		]);

		let identity = result[0];
		let registrationId = result[1];

		var keys = await Promise.all([
			libsignal.KeyHelper.generatePreKey(preKeyId),
			libsignal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
		]);

		let preKey = keys[0];
		let signedPreKey = keys[1];

		this.store.storePreKey(preKeyId, preKey.keyPair);
		this.store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

		return {
			identityKey: identity.pubKey,
			registrationId: registrationId,
			preKey: {
				keyId: preKeyId,
				publicKey: preKey.keyPair.pubKey,
			},
			signedPreKey: {
				keyId: signedPreKeyId,
				publicKey: signedPreKey.keyPair.pubKey,
				signature: signedPreKey.signature,
			},
		};
	}
}

/**
 * Registers your Signal Protocol credentials with the Signal server.
 */
async function initializeSignalProtocolManagerUser(authenticatorCode) {
	SignalServer = new SignalServerStore();
	signalProtocolManagerUser = new SignalProtocolManager(
		authenticatorCode,
		SignalServer
	);
	await signalProtocolManagerUser.initializeAsync();
}

/**
 * Verify that a user exists on the Signal server store.
 * @param {string} userId
 * @returns
 */
async function checkUserExists(userId) {
	return new Promise((resolve, reject) => {
		//Register the key with the server
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				sessionStorage.setItem("user2", userId);
				resolve(true);
			} else if (this.status == 404) {
				resolve(false);
			}
		};
		xhttp.open("POST", `${serverUrl}/checkUserExists/${userId}`, true);
		xhttp.send();
	});
}

/**
 * Encrypt the string-encoded zip and send it off for transferring.
 * @param {string} file
 */
async function fileSender(file) {
	logActivity(`Data encryption starting...`);
	signalProtocolManagerUser
		.encryptMessageAsync(sessionStorage.getItem("user2"), file)
		.then((encryptedMessage) => {
			logActivity(`Data encryption complete.`);
			const packagedMessage = JSON.stringify({
				registrationId: encryptedMessage.registrationId,
				type: encryptedMessage.type,
				body: encryptedMessage.body,
			});
			//Send the file.
			sendFileToPeer(packagedMessage);
		});
}

/**
 * Handles decryption, decoding, and file download.
 * @param {string} encryptedMessage
 */
async function fileReceiver(encryptedMessage) {
	logActivity(`Data decryption starting...`);
	signalProtocolManagerUser
		.decryptMessageAsync(sessionStorage.getItem("user1"), encryptedMessage)
		.then((decryptedMessage) => {
			logActivity(`Data decryption complete.`);
			logActivity(`Starting download...`);
			var downloadFile = get_blob_from_string(
				decryptedMessage,
				"application/zip",
				"hermes"
			);
			downloadBlob(downloadFile, "hermes");
			logActivity(`Done downloading.`);
		});
}

/**
 * Turn a zip file encoded as a string into a blob
 * @param {string} string the string encoded zip file
 * @param {string} type file type of the output
 * @param {string} name name of the output
 */
function get_blob_from_string(string, type, name) {
	let array = new Uint8Array(string.length);
	for (let i = 0; i < string.length; i++) {
		array[i] = string.charCodeAt(i);
	}
	logActivity(`Created blob from decrypted string.`);
	return new Blob([array], { type: type, name: name });
}

/**
 * Take in a blob and download it as a zip
 * @param {Blob} file
 * @param {string} name
 */
function downloadBlob(file, name) {
	let a = document.createElement("a");
	a.href = URL.createObjectURL(file);
	a.download = name;
	a.target = "_blank";
	logActivity(`Downloading...`);
	a.click();
}

/**
 * Take in any amount of files and return a single zip encoded as a string.
 * @param {Array<Object>} files
 * @returns
 */
async function zipAll(files) {
	var zip = new JSZip();
	return new Promise((resolve, reject) => {
		logActivity(`Zip/Compression beginning...`);
		//Create single file out of all files using their full path
		for (var i = 0; i < files.length; i++) {
			let file = files[i];
			zip.file(file.fullPath, file);
		}
		//Create zip file and compress (1=fastest & 9=best)
		zip
			.generateAsync({
				type: "string",
				compression: "DEFLATE",
				compressionOptions: {
					level: 1,
				},
			})
			.then((zip) => {
				logActivity(`Zip/Compression complete.`);
				resolve(zip);
			});
	});
}
