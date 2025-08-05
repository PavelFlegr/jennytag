const express = require('express')
const app = express()
const port = 3000

const tags = {}
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "pug")
app.get('/:id', (req, res) => {
    let id = req.params["id"]
    let links = tags[id]
    if(links) {
        res.render("index", {links})
    } else {
        res.redirect(`/${id}/edit`)
    }
})

app.get('/:id/edit', (req, res) => {
    let id = req.params["id"]
    let links = tags[id] ?? []
    console.log(links)
    res.render("edit", {links, id})
})

app.post("/:id/edit", (req, res) => {
    let id = req.params["id"]
    tags[id] = req.body.links
    res.redirect(`/${id}`)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
