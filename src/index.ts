import express from 'express';

const app = express();

app.listen(8080, () => {
	console.log('Server started at http://localhost:8080');
});