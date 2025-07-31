import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAudioPlayer } from '../useAudioPlayer'

// Mock HTMLAudioElement for testing
class MockAudio {
  public src = ''
  public paused = true
  private eventListeners: { [key: string]: EventListener[] } = {}

  addEventListener(event: string, listener: EventListener) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(listener)
  }

  removeEventListener(event: string, listener: EventListener) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener)
      if (index > -1) {
        this.eventListeners[event].splice(index, 1)
      }
    }
  }

  dispatchEvent(event: Event) {
    const listeners = this.eventListeners[event.type]
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
    return true
  }

  async play() {
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }
}

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(() => new MockAudio())

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    expect(result.current.currentPlaying).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should correctly identify playing state', () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    expect(result.current.isPlaying('pikachu')).toBe(false)
  })

  it('should handle playAudio call', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    await act(async () => {
      await result.current.playAudio('pikachu')
    })
    
    expect(result.current.currentPlaying).toBe('pikachu')
    expect(global.Audio).toHaveBeenCalledWith('mp3/pikachu.mp3')
  })

  it('should handle stopAudio call', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    // First play audio
    await act(async () => {
      await result.current.playAudio('pikachu')
    })
    
    // Then stop it
    act(() => {
      result.current.stopAudio()
    })
    
    expect(result.current.currentPlaying).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle pokemon name with # character', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    await act(async () => {
      await result.current.playAudio('#001-bulbasaur')
    })
    
    expect(global.Audio).toHaveBeenCalledWith('mp3/001-bulbasaur.mp3')
  })

  it('should not create new audio if same pokemon is already playing', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    
    await act(async () => {
      await result.current.playAudio('pikachu')
    })
    
    const callCount = vi.mocked(global.Audio).mock.calls.length
    
    await act(async () => {
      await result.current.playAudio('pikachu')
    })
    
    // Should not create new Audio instance
    expect(vi.mocked(global.Audio).mock.calls.length).toBe(callCount)
  })
})