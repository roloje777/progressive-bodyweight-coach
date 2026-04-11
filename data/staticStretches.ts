import { StretchRoutine} from "../models/stretchRoutine";

export const staticStretches: StretchRoutine = {
  title: "Static Stretching Routine",
  type: "time",
  exercises: [
    {
      id: "Seated-Back-Twist",
      name: "Seated Back Twist",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: true
      },
    }, 
    {
      id: "Quad-Stretch",
      name: "Quad Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },
     {
      id: "Hip-Abductor-Stretch",
      name: "Hip Abductor Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide: false,
       },
    },
     {
      id: "standing-forward-bend",
      name: "Standing Forward Bend",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
    },
     {
      id: "Lat-Stretches",
      name: "Lat Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
    },
     {
      id: "Glute-Stretches",
      name: "Glute Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
    },
      {
      id: "Calf-Stretches",
      name: "Calf Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },

    },
         {
      id: "Lying-Abdominal-Stretches",
      name: "Lying Abdominal Stretches",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:false
       },
       
    },
             {
      id: "Neck-Side-Bend",
      name: "Neck Side Bend",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },
                {
      id: "Shoulder-Stretch",
      name: "Shoulder Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },
                  {
      id: "triceps-stretch",
      name: "Triceps Stretch",
      type: "time",
      config: {
        durationSeconds: 15,
        perSide:true
       },
       
    },   
 
  
  ],
};