<script lang="ts">
    import { fade } from 'svelte/transition';
  
    export let loading: boolean;
  
  </script>
  
  {#if loading}
    <div class="loading-overlay" transition:fade="{{ duration: 300 }}">
      <div class="loading-content">
        <p>Loading currency data.</p>
        <div class="spinner"></div>
        <p>This might take a while.</p>
      </div>
    </div>
  {/if}
  
  <style>
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: saturate(1.8) blur(20px);
    }
  
    .loading-content {
      text-align: center;
      color: white;
      font-family: 'Nunito', 'sans-serif';
    }
  
    .spinner {
      width: 50px;
      height: 50px;
      border: none;
      border-bottom: 5px solid #EB001B;
      border-top: 5px solid #F79E1B;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
  
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>