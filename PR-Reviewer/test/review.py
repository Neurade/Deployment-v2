import asyncio
import httpx
import json
import time

async def send_request(i):
    url = "http://127.0.0.1:8000/api/review"
    with open("./test/request.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    start = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=data)
    duration = time.perf_counter() - start

    print(f"✅ Request {i} done in {duration:.2f}s, status {r.status_code}")
    return duration

async def main():
    total_start = time.perf_counter()

    tasks = [asyncio.create_task(send_request(i)) for i in range(7)]
    durations = await asyncio.gather(*tasks)

    total_time = time.perf_counter() - total_start
    print("\n==== Benchmark Result ====")
    print(f"Total time (all 7 async): {total_time:.2f}s")
    print(f"Max single request time : {max(durations):.2f}s")
    print(f"Min single request time : {min(durations):.2f}s")
    print(f"Avg single request time : {sum(durations)/len(durations):.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
