import { Router } from "express";
import { isValidObjectId } from "mongoose";
import categories, { validCategories } from "../models/categories.models.js";
const router=Router();
router.get('/', async(req,res)=>{
    try{
         const allCategories=await categories.find({});
    console.log('you get Categories');
res.status(200).json(allCategories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: "Failed to retrieve categories" });
   }
});
router.get('/:id', async(req,res)=>{
    try{
        const {id}=req.params;
        if(!isValidObjectId(id))
            return res.status(404).json({error:{massege:'not valid id'}});
         const category=await categories.findById(id);
    console.log('you get category by id');
res.status(200).json(category);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: "Failed to retrieve categories" });
   }
});
router.post('/', async(req,res)=>{
    const { error } = validCategories.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try{
         const newCategory=new categories(req.body);
         await newCategory.save();
         res.status(201).json(newCategory)
    }
    catch (error) {
        console.error('Error fetchingn categories:', error);
        res.status(400).json({ message: "Failed to add category" });
   }
});
router.delete('/:id',async(req,res)=>{
    try{
         const {id}=req.params;
         if(!isValidObjectId(id))
           return res.status(404).json({ message: "not valid id" });
        const category=await categories.findByIdAndDelete(id);
        if(!category){
            return res.status(404).json({ message: "category not found" });
        }
    res.status(204).end();
}
     catch (error) {
        res.status(500).json(error);
    }
});
router.put('/:id',async(req, res)=>{
    try{
        const {id}=req.params;
if(!isValidObjectId(id))
     return res.status(404).json({ message: "not valid id" });
const category=await categories.findByIdAndUpdate(id, {$set:req.body},{new:true,runValidators:true});
if(!category)
    res.status(404).json({error:{massage:'campaign not found'}})
else
    res.status(200).json(category);
}
 catch(error) {
        res.status(500).json(error);
 }
});
   

export default router;