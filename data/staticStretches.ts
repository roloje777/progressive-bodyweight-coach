import { StretchRoutine} from "../models/stretchRoutine";

export const staticStretches: StretchRoutine = {
  title: "Static Stretching Routine",
  type: "time",
  exercises: [
    {
      id: "sbs",
      name: "Seated Back Twist",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: true
      },
    }, 
    {
      id: "qs",
      name: "Quad Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },
     {
      id: "has",
      name: "Hip Abductor Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: false,
       },
    },
     {
      id: "hams",
      name: "Hamstring Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
    },
     {
      id: "lats",
      name: "Lat Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
    },
     {
      id: "glute",
      name: "Glute Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
    },
      {
      id: "calf",
      name: "Calf Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },

    },
         {
      id: "las",
      name: "Lying Abdominal Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
       
    },
             {
      id: "nsb",
      name: "Neck Side Bend",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },
                {
      id: "ss",
      name: "Shoulder Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },
                  {
      id: "ts",
      name: "Triceps Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },


    
 
  
  ],
};