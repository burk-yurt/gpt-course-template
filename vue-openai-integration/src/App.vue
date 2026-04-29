<template>
  <div id="app">
    <h1>Knowledge Graph Editor</h1>

    <div class="layout">
      <section class="panel">
        <h2>Hierarchy</h2>
        <h3>Questions</h3>
        <ul>
          <li
            v-for="question in questions"
            :key="question.id"
            class="item"
            @click="selectNode('question', question.id)"
          >
            <strong>{{ question.text }}</strong>
            <span class="sub">(parent: {{ question.parentQuestionId || 'none' }})</span>
          </li>
        </ul>

        <h3>Artifacts</h3>
        <ul>
          <li
            v-for="artifact in artifacts"
            :key="artifact.id"
            class="item"
            @click="selectNode('artifact', artifact.id)"
          >
            <strong>{{ artifact.name }}</strong>
            <span class="sub">({{ artifact.fields.length }} fields)</span>
          </li>
        </ul>

        <h3>Fields</h3>
        <ul>
          <li
            v-for="field in allFields"
            :key="field.id"
            class="item"
            @click="selectNode('field', field.id)"
          >
            <strong>{{ field.name }}</strong>
            <span class="sub">{{ field.fieldType }} / {{ field.sourceType }}</span>
          </li>
        </ul>

        <h3>Edges</h3>
        <ul>
          <li
            v-for="edge in edges"
            :key="edge.id"
            class="item"
            @click="selectNode('edge', edge.id)"
          >
            <strong>{{ edge.type }}</strong>
            <span class="sub">{{ edge.from }} → {{ edge.to }}</span>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Graph View (JSON)</h2>
        <pre>{{ graphSnapshot }}</pre>
      </section>

      <section class="panel">
        <h2>Inspector</h2>

        <div v-if="selectedQuestion">
          <h3>Question inspector</h3>
          <label>
            Text
            <input v-model="selectedQuestion.text" />
          </label>
          <label>
            Parent Question
            <select v-model="selectedQuestion.parentQuestionId">
              <option :value="null">None</option>
              <option
                v-for="option in availableParentQuestions"
                :key="option.id"
                :value="option.id"
              >
                {{ option.text }}
              </option>
            </select>
          </label>
        </div>

        <div v-else-if="selectedArtifact">
          <h3>Artifact inspector</h3>
          <label>
            Name
            <input v-model="selectedArtifact.name" />
          </label>

          <h4>Add custom field</h4>
          <label>
            Field type
            <select v-model="newField.fieldType">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="boolean">boolean</option>
            </select>
          </label>
          <label>
            Source type
            <select v-model="newField.sourceType">
              <option value="manual">manual</option>
              <option value="derived">derived</option>
              <option value="inferred">inferred</option>
            </select>
          </label>
          <label>
            Example value
            <input v-model="newField.exampleValue" />
          </label>
          <button @click="addFieldToSelectedArtifact">Add field</button>
        </div>

        <div v-else-if="selectedField">
          <h3>Field inspector</h3>
          <label>
            Name
            <input v-model="selectedField.name" :disabled="selectedField.locked || selectedField.isDefault" />
          </label>
          <label>
            Field type
            <select v-model="selectedField.fieldType">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="boolean">boolean</option>
            </select>
          </label>
          <label>
            Source type
            <select v-model="selectedField.sourceType">
              <option value="manual">manual</option>
              <option value="derived">derived</option>
              <option value="inferred">inferred</option>
            </select>
          </label>
          <label>
            Example value
            <input v-model="selectedField.exampleValue" />
          </label>

          <button :disabled="selectedField.locked || selectedField.isDefault" @click="deleteSelectedField">
            Delete field
          </button>
        </div>

        <div v-else-if="selectedEdge">
          <h3>Edge inspector</h3>
          <label v-if="selectedEdge.type === 'fieldRelationship'">
            Relationship type
            <select v-model="selectedEdge.relationshipType">
              <option value="dependsOn">dependsOn</option>
              <option value="mapsTo">mapsTo</option>
              <option value="validates">validates</option>
            </select>
          </label>

          <button @click="deleteSelectedEdge">Delete edge</button>
        </div>

        <p v-else>Select a question, artifact, field, or edge.</p>
      </section>
    </div>
  </div>
</template>

<script>
let nextId = 100;
const uid = (prefix) => `${prefix}-${nextId++}`;

export default {
  data() {
    return {
      selectedNode: null,
      questions: [
        { id: 'q-1', text: 'What is the customer name?', parentQuestionId: null },
        { id: 'q-2', text: 'What is the invoice date?', parentQuestionId: 'q-1' },
      ],
      artifacts: [
        {
          id: 'a-1',
          name: 'Invoice',
          fields: [
            {
              id: 'f-1',
              name: 'Customer Name',
              fieldType: 'string',
              sourceType: 'manual',
              exampleValue: 'Acme Corp',
              locked: true,
              isDefault: true,
            },
            {
              id: 'f-2',
              name: 'Invoice Date',
              fieldType: 'date',
              sourceType: 'manual',
              exampleValue: '2026-01-04',
              locked: false,
              isDefault: false,
            },
          ],
        },
      ],
      edges: [
        { id: 'e-1', type: 'fieldRelationship', from: 'f-1', to: 'f-2', relationshipType: 'dependsOn' },
        { id: 'e-2', type: 'questionToArtifact', from: 'q-1', to: 'a-1' },
      ],
      newField: {
        fieldType: 'string',
        sourceType: 'manual',
        exampleValue: '',
      },
    };
  },
  computed: {
    allFields() {
      return this.artifacts.flatMap((artifact) => artifact.fields);
    },
    selectedQuestion() {
      if (this.selectedNode?.type !== 'question') return null;
      return this.questions.find((q) => q.id === this.selectedNode.id) || null;
    },
    selectedArtifact() {
      if (this.selectedNode?.type !== 'artifact') return null;
      return this.artifacts.find((a) => a.id === this.selectedNode.id) || null;
    },
    selectedField() {
      if (this.selectedNode?.type !== 'field') return null;
      return this.allFields.find((f) => f.id === this.selectedNode.id) || null;
    },
    selectedEdge() {
      if (this.selectedNode?.type !== 'edge') return null;
      return this.edges.find((e) => e.id === this.selectedNode.id) || null;
    },
    availableParentQuestions() {
      if (!this.selectedQuestion) return [];
      return this.questions.filter((q) => q.id !== this.selectedQuestion.id);
    },
    graphSnapshot() {
      return JSON.stringify(
        {
          questions: this.questions,
          artifacts: this.artifacts,
          edges: this.edges,
        },
        null,
        2,
      );
    },
  },
  methods: {
    selectNode(type, id) {
      this.selectedNode = { type, id };
    },
    addFieldToSelectedArtifact() {
      if (!this.selectedArtifact) return;
      this.selectedArtifact.fields.push({
        id: uid('f'),
        name: `Custom Field ${this.selectedArtifact.fields.length + 1}`,
        fieldType: this.newField.fieldType,
        sourceType: this.newField.sourceType,
        exampleValue: this.newField.exampleValue,
        locked: false,
        isDefault: false,
      });
      this.newField.exampleValue = '';
    },
    deleteSelectedField() {
      if (!this.selectedField || this.selectedField.locked || this.selectedField.isDefault) return;
      for (const artifact of this.artifacts) {
        const index = artifact.fields.findIndex((f) => f.id === this.selectedField.id);
        if (index >= 0) {
          artifact.fields.splice(index, 1);
          this.edges = this.edges.filter((edge) => edge.from !== this.selectedField.id && edge.to !== this.selectedField.id);
          this.selectedNode = null;
          return;
        }
      }
    },
    deleteSelectedEdge() {
      if (!this.selectedEdge) return;
      this.edges = this.edges.filter((edge) => edge.id !== this.selectedEdge.id);
      this.selectedNode = null;
    },
  },
};
</script>

<style>
body {
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  padding: 20px;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
.panel {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px;
}
.item {
  cursor: pointer;
  margin-bottom: 6px;
}
.sub {
  display: block;
  color: #666;
  font-size: 12px;
}
label {
  display: block;
  margin-bottom: 10px;
}
input, select, button {
  display: block;
  width: 100%;
  margin-top: 4px;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}
</style>
