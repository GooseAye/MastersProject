<!--- This timer was created using a guide, and therefore, is largely similar to the below guide:-->
<!----https://medium.com/js-dojo/how-to-create-an-animated-countdown-timer-with-vue-89738903823f--->

<script>
export default {
    props: {
        timeToGo: {
            type: Number,
            required: true
        },
        formattedTimeToGo: {
          type: Number,
          required: true
        },
        startTime: {
          type: Number,
          required: true
        },
        alertTime: {
          type: Number,
          required: true,
          default: 15
        }
    },
    computed: {
      circleArray(){
        return `${(this.timeFraction * 283).toFixed(0)} 283`;
      },
      timeFraction(){
        return (this.timeToGo / this.startTime) - (1/ this.timeToGo) * (1 - (this.timeToGo/this.startTime));
      },
      colours(){
        return {
          info: { 
            colour: "green"
          },
          alert: {
            colour: "red",
            threshold: this.alertTime
          }
        }
      },
      colourOfTimer(){
        const { info, alert} = this.colours;

        

        console.log(this.timeToGo <= alert.threshold);
        console.log(this.timeToGo);
        console.log(alert.threshold)

        if(this.timeToGo <= alert.threshold){
          return alert.colour;
        }else{
          return info.colour;
        }
      }
    }
}</script>

<template>
  <div class="base-timer">
    <svg
      class="base-timer__svg"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g class="base-timer__circle">
        <circle
          class="base-timer__path-elapsed"
          cx="50"
          cy="50"
          r="46.5"
        />
      </g>
      <path :stroke-dasharray="circleArray" :class="colourOfTimer" class="base-timer__path-remaining" d="M 50, 50 m -45, 0 a 45,45 0 1, 0 90, 0 a 45, 45 0 1, 0 -90, 0"></path>
    </svg>
    <span class="base-timer__label">
      {{ formattedTimeToGo }} 
    </span>
  </div>
</template>


/* https://medium.com/js-dojo/how-to-create-an-animated-countdown-timer-with-vue-89738903823f */
<style scoped lang="scss">
.base-timer {
  position: relative;
  margin-left: 60px;
  width: 75px;
  height: 75px;

  &__circle {
    fill: none;
    stroke: none;
  }

  &__path-elapsed {
    stroke-width: 7px;
    stroke:grey;
  }
  &__label {
    position: absolute;    
    
    width: 75px;
    height: 75px;
    top: 0;   
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
  }
  &__path-remaining {
    stroke-width: 6px;
    stroke-linecap: round;

    transform: rotate(90deg);
    transform-origin: center;

    transition: 1s linear all;

    //stroke: #20C20E;
    //stroke-dasharray: 200 283;

    &.green {
      color: #20C20E;
      stroke: #20C20E
    }
    &.red {
      color: red;
      stroke: red;
    }
  }
  &__svg {
    transform: scaleX(-1);
  }
}
</style>
