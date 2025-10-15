import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Footer',
  setup() {
    return () => (
      <footer style="padding: 10px; background: #ccc">
        <p>This is the Footer</p>
      </footer>
    )
  }
})
