<template>
  <div id="app">
    <input v-model="inputText" placeholder="Enter your syllabus details">
    <button @click="generateText">Generate</button>
    <p>Generated Text: {{ generatedText }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputText: '',
      generatedText: ''
    };
  },
  methods: {
    async generateText() {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: this.inputText })
      });
      const data = await response.json();
      this.generatedText = data.text;
    }
  }
}
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
