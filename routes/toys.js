const express = require("express");
const { auth } = require("../middleweres/auth");
const { ToysModel, validateToy } = require("../models/toysModel")
const router = express.Router();

// get all toyss
router.get("/", async (req, res) => {
  let perPage = Math.min(req.query.perPage, 20) || 10;
  let page = req.query.page || 1;
  let sort = req.query.sort || "_id";
  let reverse = req.query.reverse == "yes" ? -1 : 1;
  try {
    let data = await ToysModel
      .find({})
      .limit(perPage)
      .skip((page - 1) * perPage)
      .sort({ [sort]: reverse })
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})
// search
// url/toyss/search?s=
router.get("/search", async (req, res) => {
  let perPage = Math.min(req.query.perPage, 20) || 10;
  let page = req.query.page || 1;
  try {
      let searchQ = req.query.s;
      let searchReg = new RegExp(searchQ, "i");
      let animal = await ToysModel.find({ $or: [{ name: searchReg }, { info: searchReg }] })
          .limit(perPage)
          .skip((page - 1) * perPage)
      res.json(animal);
  }
  catch (err) {
      console.log(err);
      res.status(500).json({ err: err });
  }
})

// search by category
router.get("/category/:catname", async (req, res) => {
  let perPage = Math.min(req.query.perPage, 20) || 10;
  let page = req.query.page || 1;
  try {
      let searchQ = req.params.catname;
      let searchReg = new RegExp(searchQ, "i");
      let animal = await ToysModel.find({ category: searchReg })
          .limit(perPage)
          .skip((page - 1) * perPage)
      res.json(animal);
  }
  catch (err) {
      console.log(err);
      res.status(500).json({ err: err });
  }
})

// url/prices?min=10&max=40
router.get("/prices", async (req, res) => {
  let perPage = Math.min(req.query.perPage, 20) || 10;
  let page = req.query.page || 1;
  try {
      let min = req.query.min;
      let max = req.query.max;
      let animal = await ToysModel.find({ $and: [{ price: { $gte: min } }, { price: { $lte: max } }] })
          .limit(perPage)
          .skip((page - 1) * perPage)
      res.json(animal);
  }
  catch (err) {
      console.log(err);
      res.status(500).json({ err: err });
  }
})

// post new toy with token
router.post("/", auth, async (req, res) => {
  let validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let animal = new ToysModel(req.body);
    animal.user_id = req.tokenData._id;
    await animal.save();
    res.status(201).json(animal);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})

// edit with token, only user with token or admin
router.put("/:editId", auth, async (req, res) => {
  let validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let editId = req.params.editId;
    let data;
    if (req.tokenData.role == "admin") {
      data = await ToysModel.updateOne({ _id: editId }, req.body)
    }
    else {
      data = await ToysModel.updateOne({ _id: editId, user_id: req.tokenData._id }, req.body)
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})

//delete with token, only user with token or admin
router.delete("/:delId", auth, async (req, res) => {
  try {
    let delId = req.params.delId;
    let data;
    if (req.tokenData.role == "admin") {
      data = await ToysModel.deleteOne({ _id: delId })
    }
    else {
      data = await ToysModel.deleteOne({ _id: delId, user_id: req.tokenData._id })
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})
module.exports = router;