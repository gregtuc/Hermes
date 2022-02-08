//---------Input Flow----------//
function fadeInStepOne() {
	$("#step-one").transition({
		animation: "fly left",
		duration: 700,
	});
}

function fadeOutStepOne() {
	$("#step-one").transition({
		animation: "fly right",
		duration: 600,
	});
	setTimeout(() => {
		fadeInStepTwo();
	}, 600);
}

function fadeOutStepOneAlt() {
	$("#step-one").transition({
		animation: "fly right",
		duration: 600,
	});
	setTimeout(() => {
		fadeInStepFive();
	}, 600);
}

function returnToStepOne() {
	$("#step-two").transition({
		animation: "fly left",
		duration: 600,
	});
	setTimeout(() => {
		$("#step-one").transition({
			animation: "fly right",
			duration: 700,
		});
	}, 600);
}

function fadeInStepTwo() {
	$("#step-two").transition({
		animation: "fly left",
		duration: 1000,
	});
}

function fadeOutStepTwo() {
	$("#step-two").transition({
		animation: "fly right",
		duration: 600,
	});
	setTimeout(() => {
		fadeInStepThree();
	}, 600);
}

function returnToStepTwo() {
	$("#step-three").transition({
		animation: "fly left",
		duration: 600,
	});
	setTimeout(() => {
		$("#step-two").transition({
			animation: "fly right",
			duration: 700,
		});
	}, 600);
}

function fadeInStepThree() {
	$("#step-three").transition({
		animation: "fly left",
		duration: 1000,
	});
	setTimeout(() => {
		$("#authenticator-input").focus();
	}, 1000);
}

function fadeOutStepThree() {
	validateAuthenticatorInput().then((result) => {
		if (result == false) {
			$("#authenticator-input").transition("shake");
		} else {
			//TODO: Fix this security vulnerability, should pass the value not re-fetch it from DOM.
			sessionStorage.setItem("user2", $("#authenticator-input").val());
			//Set the connection message for the user
			setConnectionMessage();
			$("#step-three").transition({
				animation: "fly right",
				duration: 600,
			});
			setTimeout(() => {
				fadeInStepFour();
			}, 600);
		}
	});
}

function fadeInStepFour() {
	$("#step-four").transition({
		animation: "fly left",
		duration: 1000,
	});
}

function insertStepFourB() {
	if ($("#step-four-b").hasClass("hidden")) {
		$("#step-four-b").transition({
			animation: "scale",
			duration: 1000,
		});
	}
}

function removeStepFourB() {
	if (!$("#step-four-b").hasClass("hidden")) {
		$("#step-four-b").transition({
			animation: "scale",
			duration: 1000,
		});
	}
}

//---------Utils----------//
function generateCode() {
	//Generate the authenticator ID.
	const authenticatorCode = String(
		Math.floor(10000000 + Math.random() * 90000000)
	);
	//Create a new signal profile.
	initializeSignalProtocolManagerUser(authenticatorCode).then(() => {
		//Set the ID in session storage.
		sessionStorage.setItem("user1", authenticatorCode);
		//Modify the HTML.
		$("#authenticator-code").val(`${authenticatorCode}`);
		//Initialize the p2p.
		initializePeerConnection(authenticatorCode);
	});
}

async function validateAuthenticatorInput() {
	return new Promise((resolve, reject) => {
		//Verify that the physical input is good.
		if (
			$("#authenticator-input").val().length != 8 ||
			!/^\d+$/.test($("#authenticator-input").val())
		) {
			resolve(false);
		} else {
			var authenticatorInput = String($("#authenticator-input").val());
			checkUserExists(authenticatorInput).then((result) => {
				resolve(result);
			});
			//Verify that the inputted user id exists on the server store.
		}
	});
}

function prepareDragDrop() {
	window.remove = dragDrop("#drop-zone", {
		onDrop: function (files) {
			window.files = files;
			insertStepFourB();
			logActivity(`Received ${files.length} files.`);
			zipAll(files).then((zip) => {
				fileSender(zip);
			});
		},
	});
}

function prepareManualFileInput() {
	$("#file-drop-zone").change(function (event) {
		var files = event.target.files;
		insertStepFourB();
		logActivity(`Received ${files.length} files.`);
		zipAll(files).then((zip) => {
			fileSender(zip);
		});
	});
}

function dragOverHandler(ev) {
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
	$("#drop-zone").css("background-color", "rgb(226, 246, 251)");
}

function dragEndHandler(ev) {
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
	$("#drop-zone").css("background-color", "white");
}

function copyToken() {
	navigator.clipboard.writeText($("#authenticator-code").val());

	$(".copyToken")
		.popup({
			title: "Copied to clipboard.",
			content: "Share this with your partner so they can connect to you.",
			on: "manual",
			exclusive: true,
		})
		.popup("show");
}

function logActivity(log) {
	$("#activityLog").text(log);
}

function setTimerValue() {
	Date.prototype.addHours = function (h) {
		this.setTime(this.getTime() + h);
		return this;
	};
	const date = new Date().addHours(4);
	$("#timer").append(
		" " + date.toDateString() + " at " + date.toLocaleTimeString()
	);
}

function setConnectionMessage() {
	$("#connection-message").text(
		`Encrypted file sharing enabled between ${sessionStorage.getItem(
			"user1"
		)} and ${sessionStorage.getItem("user2")}`
	);
}

function closeWindow() {
	if (confirm("Close Window?")) {
		window.close();
	}
}

//-----------Event Handlers-----------//
$(document).ready(function () {
	prepareDragDrop();
	prepareManualFileInput();
	generateCode();
	setTimerValue();
	fadeInStepOne();

	$("#file-drop-button").click(function () {
		fadeOutStepOneAlt();
	});
	$("#exchange-button").click(function () {
		fadeOutStepOne();
	});
	$("#copy-button").click(function () {
		copyToken();
	});
	$("#return-step-one-button").click(function () {
		returnToStepOne();
	});
	$("#fade-step-two-button").click(function () {
		fadeOutStepTwo();
	});
	$("#return-step-two-button").click(function () {
		returnToStepTwo();
	});
	$("#fade-step-three-button").click(function () {
		fadeOutStepThree();
	});
	$("#drop-zone").bind("dragover", function (event) {
		dragOverHandler(event);
	});
	$("#drop-zone").bind("dragleave", function (event) {
		dragEndHandler(event);
	});
	$("#drop-zone-alt").bind("dragover", function (event) {
		dragOverHandler(event);
	});
	$("#drop-zone-alt").bind("dragleave", function (event) {
		dragEndHandler(event);
	});
});
