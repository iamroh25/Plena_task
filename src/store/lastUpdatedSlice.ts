import { createSlice } from "@reduxjs/toolkit";

const lastUpdatedSlice = createSlice({
    name:"lastUpdated",
    initialState:null,
    reducers:{
        updateTime:(state,action)=>{
            return action.payload
        }
    }
})


export const {updateTime}=lastUpdatedSlice.actions

export default lastUpdatedSlice.reducer