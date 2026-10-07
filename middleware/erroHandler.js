const errorHandler = (err,req,res,next)=>{

    console.log("ERROR:");
    console.log(err);

    res.status(500).json({
        success:false,
        message:err.message
    });

};

export default errorHandler;