package services

import (
	"sync"
	"time"
)

type cacheItem struct {
	data      interface{}
	expiration time.Time
}

type MemoryCache struct {
	items map[string]cacheItem
	mu    sync.RWMutex
}

var Cache = &MemoryCache{
	items: make(map[string]cacheItem),
}

func (c *MemoryCache) Set(key string, data interface{}, duration time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = cacheItem{
		data:       data,
		expiration: time.Now().Add(duration),
	}
}

func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.items[key]
	if !found {
		return nil, false
	}

	if time.Now().After(item.expiration) {
		return nil, false
	}

	return item.data, true
}

func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

func (c *MemoryCache) ClearAll() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]cacheItem)
}
