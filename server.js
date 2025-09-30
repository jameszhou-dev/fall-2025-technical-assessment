const express = require('express');
const axios = require('axios');
const app = express();

app.get('/fetch-prof-info', async(req, res) => {
    try{
        const response = await axios.get('https://planetterp.com/api/v1/professor');
        res.json(response.data);
    } catch (error){
        console.error(error);
    }
})

app.get('/fetch-course-info', async(req, res) => {
    try{
        const response = await axios.get("https://planetterp.com/api/v1/course");
        res.response(response.data);
    } catch (error){
        console.error(error);
    }
})




app.listen(3000, () => {
        console.log('Server start');
    });