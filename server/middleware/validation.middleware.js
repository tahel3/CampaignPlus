export const validateJoiSchema = function (joiSchema) {
    return (req, res, next) => {
        const { value, error } = joiSchema.validate(req.body);
        if (error) {
            // res.status(400).json({ error: error })
            next({ status: 400, type: 'validation', msg: error.message });
        }
        else {
            req.body = value;
            next();
        }
    };
};
