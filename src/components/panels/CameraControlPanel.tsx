'use client';

import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';
import { load } from 'js-yaml';
import { useROS } from '@/ros/ROSContext';

const CAMERAS = ['Arm', 'Drive', 'Mast'];

type CameraSettings = {
  backlight_compenstation: number;
  auto_exposure: number;
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
  exposure_time_absolute: number;
  gain: number;
  white_balance_automatic: boolean;
  white_balance_temperature: number;
  exposure_dynamic_framerate: boolean;
  gamma: number;
  power_line_frequency: number;
  sharpness: number;
};

type ControlConfig = {
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  type: 'int' | 'bool' | 'menu';
  value?: number;
};

type CameraConfig = {
  path: string;
  controls: Record<string, ControlConfig>;
};

type CameraConfigFile = Record<string, CameraConfig>;


const emptySettings: CameraSettings = {
  backlight_compenstation: 0,
  auto_exposure: 0,
  brightness: 0,
  contrast: 0,
  hue: 0,
  saturation: 0,
  exposure_time_absolute: 0,
  gain: 0,
  white_balance_automatic: false,
  white_balance_temperature: 0,
  exposure_dynamic_framerate: false,
  gamma: 0,
  power_line_frequency: 0,
  sharpness: 0,
};


const YAML_TO_ROS: Record<string, keyof CameraSettings> = {

  backlight_compensation:
    'backlight_compenstation',

  backlight_compenstation:
    'backlight_compenstation',

  auto_exposure:
    'auto_exposure',

  brightness:
    'brightness',

  contrast:
    'contrast',

  hue:
    'hue',

  saturation:
    'saturation',

  exposure_time_absolute:
    'exposure_time_absolute',

  gain:
    'gain',

  white_balance_automatic:
    'white_balance_automatic',

  white_balance_temperature:
    'white_balance_temperature',

  exposure_dynamic_framerate:
    'exposure_dynamic_framerate',

  gamma:
    'gamma',

  power_line_frequency:
    'power_line_frequency',

  sharpness:
    'sharpness',
};



export default function CameraControlPanel(){

  const { ros } = useROS();


  const [camera,setCamera] =
    useState('Drive');


  const [settings,setSettings] =
    useState<CameraSettings>(
      emptySettings
    );


  const [cameraConfig,setCameraConfig] =
    useState<CameraConfigFile>({});


  const [status,setStatus] =
    useState('');



  const controls =
    cameraConfig[camera]?.controls ?? {};



  useEffect(()=>{

    loadCameraConfig();

  },[]);



  useEffect(()=>{

    if(Object.keys(cameraConfig).length){

      refreshSettings();

    }

  },[camera,cameraConfig]);



  const loadCameraConfig = async()=>{

    try{

      const response =
        await fetch('/camera_config.yaml');


      const text =
        await response.text();


      const yaml =
        load(text) as CameraConfigFile;


      setCameraConfig(yaml);

    }
    catch(e){

      console.error(
        "Failed loading camera_config.yaml",
        e
      );

    }

  };



  const responseToSettings =
    (response:any):CameraSettings=>({

      backlight_compenstation:
        response.backlight_compenstation ?? 0,

      auto_exposure:
        response.auto_exposure ?? 0,

      brightness:
        response.brightness ?? 0,

      contrast:
        response.contrast ?? 0,

      hue:
        response.hue ?? 0,

      saturation:
        response.saturation ?? 0,

      exposure_time_absolute:
        response.exposure_time_absolute ?? 0,

      gain:
        response.gain ?? 0,

      white_balance_automatic:
        response.white_balance_automatic ?? false,

      white_balance_temperature:
        response.white_balance_temperature ?? 0,

      exposure_dynamic_framerate:
        response.exposure_dynamic_framerate ?? false,

      gamma:
        response.gamma ?? 0,

      power_line_frequency:
        response.power_line_frequency ?? 0,

      sharpness:
        response.sharpness ?? 0,

    });



  const refreshSettings = ()=>{

    if(!ros)
      return;


    const service =
      new ROSLIB.Service({

        ros,

        name:'/get_camera',

        serviceType:
          'interfaces/GetCamera',

      });



    service.callService(

      new ROSLIB.ServiceRequest({
        camera
      }),

      (response:any)=>{

        if(!response.success){

          setStatus(
            "Get camera failed"
          );

          return;

        }


        setSettings(
          responseToSettings(response)
        );


        setStatus(
          "Refreshed"
        );

      }

    );

  };



  const loadPreset = ()=>{

    if(!ros)
      return;


    const service =
      new ROSLIB.Service({

        ros,

        name:'/get_camera_yaml',

        serviceType:
          'interfaces/GetCamera',

      });



    service.callService(

      new ROSLIB.ServiceRequest({
        camera
      }),

      (response:any)=>{

        if(!response.success){

          setStatus(
            "YAML load failed"
          );

          return;

        }


        setSettings(
          responseToSettings(response)
        );


        setStatus(
          "Loaded YAML"
        );

      }

    );

  };



  const applySettings = ()=>{

    if(!ros)
      return;


    const service =
      new ROSLIB.Service({

        ros,

        name:'/set_camera',

        serviceType:
          'interfaces/SetCamera',

      });



    service.callService(

      new ROSLIB.ServiceRequest({

        camera,

        ...settings

      }),


      (response:any)=>{

        if(response.success){

          setStatus(
            "Applied"
          );

          refreshSettings();

        }
        else{

          setStatus(
            "Apply failed"
          );

        }

      }

    );

  };



  const savePreset = ()=>{

    if(!ros)
      return;


    const service =
      new ROSLIB.Service({

        ros,

        name:'/save_camera',

        serviceType:
          'interfaces/SetCamera',

      });



    service.callService(

      new ROSLIB.ServiceRequest({

        camera,

        ...settings

      }),


      (response:any)=>{

        if(response.success){

          setStatus(
            "Saved YAML"
          );

        }
        else{

          setStatus(
            "Save failed"
          );

        }

      }

    );

  };



  const update = (
    key:keyof CameraSettings,
    value:any
  )=>{

    setSettings(old=>({

      ...old,

      [key]:value

    }));

  };



  return (

    <div className="camera-panel">


      <select
        value={camera}
        onChange={
          e=>setCamera(
            e.target.value
          )
        }
      >

        {
          CAMERAS.map(cam=>

            <option key={cam}>
              {cam}
            </option>

          )
        }

      </select>



      <div className="controls">


      {
        Object.entries(controls).map(

          ([yamlName,config])=>{


            const key =
              YAML_TO_ROS[yamlName];


            if(!key)
              return null;


            const value =
              settings[key];



            return (

              <div
                className="control-row"
                key={yamlName}
              >

                <div className="header">

                  <b>{yamlName}</b>

                  <span>
                    {String(value)}
                  </span>

                </div>


                {
                  config.type === 'bool'

                  ?

                  <input

                    type="checkbox"

                    checked={
                      Boolean(value)
                    }

                    onChange={
                      e=>
                        update(
                          key,
                          e.target.checked
                        )
                    }

                  />


                  :

                  config.type === 'menu'

                  ?

                  <select

                    value={
                      Number(value)
                    }

                    onChange={
                      e=>
                        update(
                          key,
                          Number(e.target.value)
                        )
                    }

                  >

                  {

                    Array.from({

                      length:
                        (config.max ?? 0)
                        -
                        (config.min ?? 0)
                        +1

                    }).map((_,i)=>{

                      const v =
                        (config.min ?? 0)+i;


                      return (

                        <option
                          key={v}
                          value={v}
                        >
                          {v}
                        </option>

                      );

                    })

                  }

                  </select>


                  :

                  <input

                    type="range"

                    min={
                      config.min ?? 0
                    }

                    max={
                      config.max ?? 100
                    }

                    step={
                      config.step ?? 1
                    }

                    value={
                      Number(value)
                    }

                    onChange={
                      e=>
                        update(
                          key,
                          Number(e.target.value)
                        )
                    }

                  />

                }


              </div>

            );

          }

        )

      }


      </div>



      <div className="buttons">

        <button onClick={refreshSettings}>
          Refresh
        </button>


        <button onClick={applySettings}>
          Apply
        </button>


        <button onClick={savePreset}>
          Save Preset
        </button>


        <button onClick={loadPreset}>
          Load Preset
        </button>

      </div>


      <div>
        {status}
      </div>



      <style jsx>{`

        .camera-panel {

          height:100%;

          display:flex;

          flex-direction:column;

          gap:12px;

          background:#1e1e1e;

          color:white;

          padding:16px;

        }


        .controls {

          flex:1;

          overflow:auto;

        }


        .control-row {

          margin-bottom:18px;

        }


        .header {

          display:flex;

          justify-content:space-between;

        }


        input[type="range"] {

          width:100%;

        }


        .buttons {

          display:grid;

          grid-template-columns:repeat(2,1fr);

          gap:8px;

        }


        button {

          padding:8px;

          background:none;

          color:white;

          border:1px solid #555;

          border-radius:5px;

        }

      `}</style>


    </div>

  );

}