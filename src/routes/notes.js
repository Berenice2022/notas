const { request, response } = require('express');
const express = require('express');
const router = express.Router();//modulo para routas 

const faker = require('faker');

//modelo de notas de la db
const Nota = require('../model/Notes');
const { isAuthenticated } = require('../helpers/auth');

router.get('/notes/search',isAuthenticated,(req,res) =>{
    res.render('notes/search-notes');
})

router.post('/notes/search',isAuthenticated, async (req,res) =>{
    const search = req.body.search;
    if(search){
        await Nota.find({usuario: req.user._id, $text: {$search: search, $caseSensitive: false}})
        .sort({fecha: 'desc'})
        .exec( (err,notas) => {
           // console.log(notas);
            res.render('notes/search-notes',{
                notas,
                search
            });
        });
    }
});

router.get('/notes/add', isAuthenticated ,function(req,res){
    res.render('notes/new-note.hbs');
});


router.get('/notes',isAuthenticated , async function(req,res){
    const notes =  await Nota.find({usuario: req.user._id}).sort({fecha: 'desc'});
    res.redirect('/notes/1');
    /*const notas =  await Nota.find({usuario: req.user._id}).sort({fecha: 'desc'});
    res.render('notes/consulta-notas',{notas});*/

    //res.send('Notas de la base de datos');
   /* await Nota.find({usuario: req.user._id}).sort({fecha: 'desc'})
              .then( (notas)=>{
               // console.log(notas);
                res.render('notes/consulta-notas', {notas});
              })
              .catch( (err)=>{
                console.log(err);
                res.redirect('/error');
              });*/
});


router.get('/notes/delete:id', isAuthenticated , async function(req,res){
    try{
        var _id = req.params.id;
        var len = req.params.id.length;
        _id = _id.substring(1,len);

        const nota = await Nota.findByIdAndDelete(_id);
        // await Nota.findByIdAndDelete(_id); this are equals, success exit the two
        req.flash('success_msg', 'Nota eliminada correctamente');
        res.redirect('/notes/');
    }catch(err){
        response.send(404);
    }
});


//edit notas
router.get('/notes/edit:id', isAuthenticated , async function(req,res) {
    /*const nota = await Nota.findById(req.params.id);
    res.render('notes/editar-nota');*/
    try{
        var _id = req.params.id;
        var len = req.params.id.length;
        _id = _id.substring(1, len);//posiscion 1 en adelante, 0 son dos puntos
        const nota = await Nota.findById(_id);//_id
       // console.log(_id);
        _id = nota._id
        titulo = nota.titulo;
        description = nota.description;
        res.render('notes/editar-nota', {titulo, description, _id})
    }catch(err){
        //res.send(404);
        res.redirect('/error');
    }
   // res.render('notes/editar-nota');
}); 

//editar 
router.put('/notes/editar-nota/:id', isAuthenticated , async function(req,res){
    //dejar el que esta en las diapositivas 
    const {titulo, description} = req.body;
    const _id=req.params.id;
    const errores=[];
    if(!titulo){
        errores.push({text:'Por favor inserta el titulo'});
    }
    if(!description){
        errores.push({text:'Por favor inserta la descripcion'});
    }
    if(errores.length > 0){
        res.render('notes/editar-nota', {
            errores,
            titulo, 
            description,
            _id
        }); 
    }else {
        const {titulo,description} = req.body;
        await Nota.findByIdAndUpdate(_id,//req.params.id 
                        {titulo, description})
                        .then ( ()=>{
                            req.flash('success_msg', 'Nota actualizada correctamente');
                            res.redirect('/notes');
                        })
                        .catch( (err)=>{
                            console.log(err);
                            res.redirect('/error');
                        });
    }
});

//guardar notas en la db
router.post('/notes/new-note', isAuthenticated , async function(req,res){
    //console.log(req.body);
    const {titulo,description}=req.body;
    const errores=[];
    if(!titulo){
        errores.push({text:'Por favor inserta el titulo'});
    }
    if(!description){
        errores.push({text:'Por favor inserta la descripcion'});
    }
    if(errores.length > 0){
        res.render('notes/new-note', {
            errores,
            titulo, 
            description
        });
    }else {
        const nuevaNota = new Nota({titulo,description});
        nuevaNota.usuario = req.user._id;
        await nuevaNota.save()  
                       .then ( ()=> {
                        req.flash('success_msg', 'Nota agregada de manera exitosa')
                        //lista de notas
                        res.redirect('/notes'); //res.redirect('/notes/consulta-notas')
                       })
                       .catch( (err)=>{
                        console.log(err);
                        res.redirect('/error');
                        })
         console.log(nuevaNota);
       // res.send("ok");
    }
});//fin guardar

//data false
router.get('/generate-fake-data', isAuthenticated, async (req,res) => {
   for(let i=0; i<30; i++){
        const newNote = new Nota();
        newNote.usuario = req.user._id;
        
        newNote.titulo = faker.random.word();
        newNote.description = faker.random.words();
        await newNote.save();
    }
   res.redirect('/notes/');
});

router.get('/notes/:page',isAuthenticated, async (req,res) => {
    let perPage=6;

    let page =req.params.page || 1

    let numNota = (perPage*page)-perPage;

    await Nota.find({user: req.user._id})
    .sort({date: 'desc'})
    .skip(numNota)
    .limit(perPage)
    .exec( (err,  notas) => {
        Nota.countDocuments ({usuario: req.user._id}, (err, total) =>{
            if(err) 
            return next(err);
            if(total==0)
            pages = null;
            else 
            pages = Math.ceil(total/perPage);
            res.render('notes/consulta-notas',{
                notas,
                current: page,
                pages: pages
            });
        })
    });
});

module.exports = router; //para que se puedad usar en el index, SE EXPORTA (IMPORTANTE)
