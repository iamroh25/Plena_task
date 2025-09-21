import {configureStore} from "@reduxjs/toolkit"
import lastUpdated from "./lastUpdatedSlice"


const store = configureStore({
    reducer:{lastUpdated}
})


export default store