import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const FollowSchema = Schema ({
    following_user:{
        type: Schema.ObjectId,
        ref: "User",
        requierd: true
    },
    followed_user: {
        type: Schema.ObjectId,
        ref: "User",
        requierd: true
    },
    created_at:{
        type: Date,
        default: Date.now
    }
});


FollowSchema.index({followed_user: 1, followed_user: 1}, {unique: true});

FollowSchema.plugin(mongoosePaginate);

export default model("Follow", FollowSchema, "follows");