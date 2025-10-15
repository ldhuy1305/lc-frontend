import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Header',
  setup() {
    return () => (
      <header style="padding: 10px; background: #eee">
        <h1>This is the Header</h1>
      </header>
    )
  }
})
