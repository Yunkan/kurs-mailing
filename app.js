const express = require('express');
const mailer = require('nodemailer');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const xlsx = require('node-xlsx');

const app = express();
const hbs = exphbs.create({
	defaulLayout: 'main',
	extname: 'hbs'
});
const upload = multer({dest:"uploads/"});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = mailer.createTransport({
	service: 'Gmail',
    auth: {
        user: 'kursMailing1@gmail.com',
        pass: 'KursovayaMoya'
    }
});

function validateEmail(email) {
  var reg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
}

async function startMailing({ to, subject, text = null, html = null }) {
	try {
		var parsedTo = [];

		if(to.originalname && path.extname(to.originalname) == '.txt') {
			const data = fs.readFileSync(`${__dirname}/uploads/${to.filename}`, 'utf8');
			parsedTo = data.split('\r\n');
		} else if(to.originalname && path.extname(to.originalname) == '.xlsx') {
			data = xlsx.parse(`${__dirname}/uploads/${to.filename}`);
			data.forEach((cells) => {
				cells.data.forEach((cell) => {				
					cell.forEach((col) => {
						if(validateEmail(col)) {
							parsedTo.push(col);
						}
					});
				});
			});
		} else {
			parsedTo = to.split(',');
		}
		
		if(html && html.originalname && path.extname(html.originalname) == '.html')
			htmlStream = await fs.createReadStream(`${__dirname}/uploads/${html.filename}`);
		else if(html && path.extname(html.originalname) != '.html') {
			return { error: 'Некорректные данные.' };
		}

		for(const to of parsedTo) {
			await transporter.sendMail({
				to,
				subject,
				text,
				html: html ? htmlStream : html
			});
		}

		if(to.filename)
			fs.unlinkSync(`${__dirname}/uploads/${to.filename}`);
		if(html && html.filename) {
			htmlStream.destroy();
			fs.unlinkSync(`${__dirname}/uploads/${html.filename}`);
		}
	} catch(e) {
		fs.readdir(`${__dirname}/uploads`, (err, files) => {
			if(err)
				throw err;

			for(const file of files) {
				fs.unlinkSync(`${__dirname}/uploads/${file}`);
			}
		});
		return { error: 'Некорректные данные.' };
	}
}
 
app.get('/', (req, res) => {
    res.render('home');
});

app.post('/send', upload.fields([{ name: 'to' }, { name: 'html' }]), (req, res) => {
	const formData = req.body;
	if(Object.entries(req.files).length !== 0) {
		if(req.files['to'])
			formData.to = req.files['to'][0];
		if(req.files['html'])
			formData.html = req.files['html'][0];
	}

	const result = startMailing({ ...formData });

	result.then((e) => {
		if(e) {
			res.render('home', {error: e.error });
		} else {
			res.redirect('/');
		}
	});
	
});

if(!module.parent){
	app.listen(5000, () => {
		console.log('Server has been started at port 5000...');
	});
}

module.exports = {
	validateEmail,
	startMailing
}