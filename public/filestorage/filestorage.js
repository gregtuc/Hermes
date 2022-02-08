/**
 * Methods for the new prototype direct file transfer function
 * Not implemented yet...
 */

async function storeFile(fileToken, encryptedFile) {
	return new Promise((resolve, reject) => {
		//Register the key with the server
		var xhttp = new XMLHttpRequest();
		var data = new FormData();
		data.append("fileToken", fileToken);
		data.append("file", encryptedFile);
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				resolve();
			}
		};
		xhttp.open("POST", `${serverUrl}/storeFile`, true);
		//xhttp.setRequestHeader("Content-type", "multipart/form-data");
		xhttp.send(data);
	});
}

async function getFile(fileToken) {
	return new Promise((resolve, reject) => {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				var data = JSON.parse(this.responseText);
				if (data) {
					resolve(data);
				} else {
					resolve();
				}
			}
		};
		xhttp.open("POST", `${serverUrl}/getFile`, true);
		xhttp.setRequestHeader("Content-type", "multipart/form-data");
		var data = new FormData();
		data.append("fileToken", fileToken);
		xhttp.send(data);
	});
}

function encryptFile(file, key) {
	return CryptoJS.AES.encrypt(file, key).toString();
}

function decryptFile(file, key) {
	return CryptoJS.AES.decrypt(file, key);
}

function generateKey(length) {
	var result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
