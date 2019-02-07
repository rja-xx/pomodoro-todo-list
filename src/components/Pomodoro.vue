<template>
  <div class="holder">
    <div class="state">
        <h1>{{ state }}</h1>
        <h2 v-if="state==='Work'">{{ tasks[0] }}</h2>
        <img v-show="state === 'Work'" :src="work" width="20%" />
        <img v-show="state === 'Rest'" :src="rest" width="20%" />
        <img v-show="state === 'Plan'" :src="plan" width="20%" />
    </div>

    <div v-if="state==='Plan'" class="todo">
      <ul>
        <li>
          <input type="text" v-on:keyup.enter="addTask" v-model="candidateTask">
        </li>
        <li>
          <button v-on:click="addTask">Add task</button>
        </li>
        <li>
          <button v-if="state!=='Work' && tasks.length !== 0"  v-on:click="startPomodoro">Start Pomodoro</button>
        </li>
      </ul>
    </div>

    <div class="plan" v-if="state==='Plan'">
      <h2>
        ToDo list
      </h2>
        <ul>
          <li v-for="task in tasks">
              <button
              v-on:keyup.space="startPomodoro"
              v-on:keyup.backspace="clearTask(task)"
              v-on:click="completeTask(task)"
              v-on:keyup.up="upTask"
              v-on:keyup.down="downTask"
              >{{task}}</button>
          </li>
        </ul>
    </div>
    <div class="result"  v-if="state==='Plan'">
      <h2>
        Pomodoros completed {{pomodorosDone}}
      </h2>
      <ul>
        <li v-for="(t,index) in completedTasks" v-if="index < 10">
          <button class="restart" v-on:click="reopenTask">{{t}}</button>
        </li>
      </ul>
    </div>
  </div>

</template>

<script>
import work from "../assets/work.png"
import rest from "../assets/rest.png"
import plan from "../assets/plan.png"
import sound from "../assets/sound.mp3"



export default {
  name: 'Pomodoro',
  props: {
    startState: String
  },
  data: function() {
      return {
        state: this.startState,
        work: work,
        rest: rest,
        plan: plan,
        restMinutes: 5,
        workMinutes: 20,
        tasks: [],
        completedTasks: [],
        pomodorosDone: 0,
        candidateTask: '',
        audio: new Audio(sound)
      }
  },
  methods: {
      startPomodoro: function(){
        this.state = 'Work';
        var self = this;
        setTimeout(function(){
          self.audio.play();
          self.pomodorosDone += 1;
          self.saveData();
          self.state = 'Rest';
          var restMinutes = self.pomodorosDone % 4 === 0 ? self.restMinutes*3 : self.restMinutes;
          setTimeout(function(){
            self.state = 'Plan';
            self.audio.play();
          }, restMinutes*60*1000);
        }, this.workMinutes*60*1000);
      },
      addTask: function(){
        if(this.candidateTask !== ''){
          this.tasks.push(this.candidateTask);
          this.candidateTask = '';
          this.saveData();
        }
      },
      clearTask: function(i){
        this.tasks.splice(this.tasks.indexOf(i), 1)
        this.saveData();
      },
      completeTask: function(i){
        var index = this.tasks.indexOf(i);
        this.completedTasks.reverse();
        this.completedTasks.push(this.tasks.splice(index, 1)[0]);
        this.completedTasks.reverse();
        this.saveData();
      },
      saveData: function() {
        const parsed = JSON.stringify({tasks: this.tasks, pomodorosDone: this.pomodorosDone, completedTasks: this.completedTasks});
        localStorage.setItem('pomodoroSaveData', parsed);
      },
      reopenTask: function(event) {
          const a = this.completedTasks.indexOf(event.target.innerText);
          this.tasks.push(this.completedTasks.splice(a, 1)[0])
          this.saveData();
          var openTasksElements = event.target.parentElement.parentElement.parentElement.previousSibling.children[1].children;
          this.$nextTick(function(){
            openTasksElements[openTasksElements.length-1].children[0].focus()
          });
      },
      upTask: function(event) {
          const a = this.tasks.indexOf(event.target.innerText);
          if(a === 0){
            return;
          }
          event.path[1].previousSibling.children[0].focus()
          const b = this.tasks[a];
          this.tasks.splice(a, 1, this.tasks[a-1]);
          this.tasks.splice(a-1, 1, b);
          this.saveData();
      },
      downTask: function(event) {
          const a = this.tasks.indexOf(event.target.innerText);
          if(a === this.tasks.length-1){
            return;
          }
          event.path[1].nextSibling.children[0].focus()
          const b = this.tasks[a];
          this.tasks.splice(a, 1, this.tasks[a+1]);
          this.tasks.splice(a+1, 1, b);
          this.saveData();
      }
  },
  mounted: function() {
    var jsonData = localStorage.getItem("pomodoroSaveData")
    if(jsonData){
      const data = JSON.parse(jsonData);
      this.tasks = data.tasks;
      this.pomodorosDone = data.pomodorosDone;
      this.completedTasks = data.completedTasks;
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.holder{
  margin-left: 20%;
  margin-right: 20%;
  align-content: center;
}
li{
  list-style-type: none
}
h1{
  font-size: 48px;
  font-weight: bold;
}
button {
  background-color: cyan;
  width: 100%;
  border-radius: 10px;
  height: 40px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 3px;
}
button:focus {
  background-color: pink
}
.todo button{
  background-color: lighten(magenta, 40);
  width: 100%
}
.todo button:focus{
  background-color: lighten(magenta, 30);
  width: 100%
}
input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  font-size: 18px;
  border-width: thick;
  margin-bottom: 20px;
}
</style>
