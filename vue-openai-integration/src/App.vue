<template>
  <div id="app" class="app-shell">
    <aside class="panel">
      <h2 class="panel-title">Hierarchy</h2>
      <button class="action-btn" @click="createQuestion">+ Question</button>

      <div v-for="question in state.questions" :key="question.id" class="card">
        <button
          class="entity-btn"
          :class="{ active: isSelected('question', question.id) }"
          @click="selectEntity('question', question.id)"
        >
          {{ question.title }}
        </button>

        <div class="children">
          <button
            v-for="artifact in artifactsByQuestion(question.id)"
            :key="artifact.id"
            class="entity-btn child"
            :class="{ active: isSelected('artifact', artifact.id) }"
            @click="selectEntity('artifact', artifact.id)"
          >
            {{ artifact.name }}
          </button>
        </div>
      </div>
    </aside>

    <main class="panel">
      <h2 class="panel-title">Graph Canvas</h2>
      <div class="toolbar">
        <button class="action-btn" @click="addGraphNode">+ Node</button>
        <button class="action-btn" @click="addGraphEdge" :disabled="state.graphNodes.length < 2">+ Edge</button>
      </div>

      <div class="canvas-list">
        <div
          v-for="node in state.graphNodes"
          :key="node.id"
          class="card"
          :class="{ active: isSelected('node', node.id) }"
          @click="selectEntity('node', node.id)"
        >
          <strong>{{ node.label }}</strong>
          <div class="muted">Artifact: {{ node.artifactId }}</div>
        </div>

        <div
          v-for="edge in state.graphEdges"
          :key="edge.id"
          class="pill"
          :class="{ active: isSelected('edge', edge.id) }"
          @click="selectEntity('edge', edge.id)"
        >
          {{ edge.label }} ({{ edge.sourceNodeId }} → {{ edge.targetNodeId }})
        </div>
      </div>
    </main>

    <aside class="panel">
      <h2 class="panel-title">Inspector</h2>
      <div class="card" v-if="selectedQuestion">
        <h3>Question</h3>
        <input v-model="selectedQuestion.title" class="input" />
      </div>

      <div class="card" v-if="selectedArtifact">
        <h3>Artifact</h3>
        <input v-model="selectedArtifact.name" class="input" />
        <div class="field-pills">
          <span v-for="field in selectedArtifactFields" :key="field.id" class="pill" :class="{ locked: field.locked }">
            {{ field.name }}
          </span>
        </div>
      </div>

      <div class="card" v-if="selectedNode">
        <h3>Graph Node</h3>
        <input v-model="selectedNode.label" class="input" />
      </div>

      <div class="card" v-if="selectedEdge">
        <h3>Graph Edge</h3>
        <input v-model="selectedEdge.label" class="input" />
      </div>
    </aside>
  </div>
</template>

<script>
const DEFAULT_ARTIFACT_FIELDS = ['Process Description', 'Trigger', 'Quality Gate'];

const makeId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * @typedef {{ id: string, title: string, artifactId: string }} Question
 * @typedef {{ id: string, questionId: string, name: string }} Artifact
 * @typedef {{ id: string, artifactId: string, name: string, value: string, locked: boolean }} ArtifactField
 * @typedef {{ id: string, sourceFieldId: string, targetFieldId: string, type: string }} FieldRelationship
 * @typedef {{ id: string, artifactId: string, label: string, x: number, y: number }} GraphNode
 * @typedef {{ id: string, sourceNodeId: string, targetNodeId: string, label: string }} GraphEdge
 */
export default {
  data() {
    return {
      state: {
        /** @type {Question[]} */
        questions: [],
        /** @type {Artifact[]} */
        artifacts: [],
        /** @type {ArtifactField[]} */
        artifactFields: [],
        /** @type {FieldRelationship[]} */
        fieldRelationships: [],
        /** @type {GraphNode[]} */
        graphNodes: [],
        /** @type {GraphEdge[]} */
        graphEdges: [],
        selection: /** @type {{ kind: 'question'|'artifact'|'node'|'edge'|null, id: string|null }} */ ({
          kind: null,
          id: null,
        }),
      },
    };
  },
  computed: {
    selectedQuestion() {
      return this.state.selection.kind === 'question'
        ? this.state.questions.find((q) => q.id === this.state.selection.id)
        : null;
    },
    selectedArtifact() {
      return this.state.selection.kind === 'artifact'
        ? this.state.artifacts.find((a) => a.id === this.state.selection.id)
        : null;
    },
    selectedArtifactFields() {
      if (!this.selectedArtifact) return [];
      return this.state.artifactFields.filter((f) => f.artifactId === this.selectedArtifact.id);
    },
    selectedNode() {
      return this.state.selection.kind === 'node'
        ? this.state.graphNodes.find((n) => n.id === this.state.selection.id)
        : null;
    },
    selectedEdge() {
      return this.state.selection.kind === 'edge'
        ? this.state.graphEdges.find((e) => e.id === this.state.selection.id)
        : null;
    },
  },
  methods: {
    isSelected(kind, id) {
      return this.state.selection.kind === kind && this.state.selection.id === id;
    },
    selectEntity(kind, id) {
      this.state.selection = { kind, id };
    },
    artifactsByQuestion(questionId) {
      return this.state.artifacts.filter((a) => a.questionId === questionId);
    },
    createArtifact(questionId) {
      const artifactId = makeId('artifact');
      const artifact = { id: artifactId, questionId, name: `Artifact ${this.state.artifacts.length + 1}` };
      this.state.artifacts.push(artifact);

      DEFAULT_ARTIFACT_FIELDS.forEach((fieldName) => {
        this.state.artifactFields.push({
          id: makeId('field'),
          artifactId,
          name: fieldName,
          value: '',
          locked: true,
        });
      });

      return artifact;
    },
    createQuestion() {
      const questionId = makeId('question');
      const artifact = this.createArtifact(questionId);

      this.state.questions.push({
        id: questionId,
        title: `Question ${this.state.questions.length + 1}`,
        artifactId: artifact.id,
      });

      this.selectEntity('question', questionId);
    },
    addGraphNode() {
      const firstArtifact = this.state.artifacts[0];
      if (!firstArtifact) return;

      const node = {
        id: makeId('node'),
        artifactId: firstArtifact.id,
        label: `Node ${this.state.graphNodes.length + 1}`,
        x: 0,
        y: 0,
      };
      this.state.graphNodes.push(node);
      this.selectEntity('node', node.id);
    },
    addGraphEdge() {
      if (this.state.graphNodes.length < 2) return;
      const source = this.state.graphNodes[this.state.graphNodes.length - 2];
      const target = this.state.graphNodes[this.state.graphNodes.length - 1];
      const edge = {
        id: makeId('edge'),
        sourceNodeId: source.id,
        targetNodeId: target.id,
        label: `Edge ${this.state.graphEdges.length + 1}`,
      };
      this.state.graphEdges.push(edge);
      this.selectEntity('edge', edge.id);
    },
  },
};
</script>

<style>
:root {
  --bg: #f6f7f9;
  --panel: #ffffff;
  --border: #dce1e8;
  --muted: #677285;
  --accent: #4f7cff;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); }

#app.app-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 12px;
  padding: 12px;
  background: var(--bg);
  color: #1f2a38;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  overflow: auto;
}
.panel-title { font-size: 14px; margin: 0 0 10px; }
.card { border: 1px solid var(--border); border-radius: 10px; padding: 10px; margin-bottom: 8px; background: #fff; }
.card.active, .pill.active, .entity-btn.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
.entity-btn {
  width: 100%;
  text-align: left;
  border: 1px solid var(--border);
  background: #fff;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}
.entity-btn.child { margin-top: 6px; font-size: 12px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.action-btn { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 6px 10px; cursor: pointer; }
.input { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; }
.pill { display: inline-block; border: 1px solid var(--border); border-radius: 999px; padding: 4px 8px; margin: 4px 6px 0 0; font-size: 12px; }
.pill.locked { background: #f2f5fb; }
.muted { color: var(--muted); font-size: 12px; }
</style>
