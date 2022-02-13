//Express imports
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var path = require("path");

//Middleware imports
var cors = require("cors");
var bodyparser = require("body-parser");
const helmet = require("helmet"); //sets http headers for security
var bouncer = require("express-bouncer")(500, 900000); //rate limiter

//white listing localhost for rate-limiter
bouncer.whitelist.push("127.0.0.1");
bouncer.whitelist.push("localhost");

//Middleware
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			"default-src": ["'self'"],
			"connect-src": ["'self'", "wss:"],
			"style-src": [
				"'self'",
				"'unsafe-inline'",
				"https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.4.1/semantic.min.css",
				"https://fonts.googleapis.com/",
				"https://fonts.gstatic.com/",
			],
			"script-src": [
				"'self'",
				"https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.4.1/semantic.min.js",
			],
		},
	})
);

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

//Signal temporary storage
const NodeCache = require("node-cache");
const signalCache = new NodeCache();

//Serve static route
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
	res.sendFile("home.html", { root: "public" });
});

//---------Signal----------//
app.post("/registerNewPreKeyBundle/:userId", (req, res) => {
	const userId = req.params.userId;
	const preKeyBundle = req.body;
	if (userId && preKeyBundle && !signalCache.has(userId)) {
		const success = signalCache.set(userId, preKeyBundle, 86400);
		if (success) {
			bouncer.reset(req); //reset rate-limiter
			res.status(200).send();
		} else {
			res.status(500).send();
		}
	} else {
		res.status(400).send();
	}
});
app.post("/getPreKeyBundle", bouncer.block, (req, res) => {
	const userId = req.body.userId;
	if (userId && signalCache.has(userId)) {
		const preKeyBundle = signalCache.get(userId);
		bouncer.reset(req); //reset rate-limiter
		res.status(200).send(preKeyBundle);
	} else {
		res.status(400).send();
	}
});
app.post("/checkUserExists/:userId", bouncer.block, (req, res) => {
	const userId = req.params.userId;
	if (userId && signalCache.has(userId)) {
		bouncer.reset(req); //reset rate-limiter
		res.status(200).send();
	} else {
		res.status(404).send();
	}
});
app.listen(port, () => {
	console.log(`Listening on ${port}`);
});
