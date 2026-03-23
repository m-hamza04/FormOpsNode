import mongoose from 'mongoose';

export function connection(){
    mongoose.connect(process.env.MONGO_URL)
        .then(() => {
            console.log('Database connected!!')
        }).catch((err) => {
            console.log(`Error ${err}`);
        });
}