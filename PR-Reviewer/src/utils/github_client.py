import os
import httpx
from dotenv import load_dotenv
import pprint

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

async def get_pr_diff_async(owner: str, repo_name: str, pr_number: int, github_token=None):
    token = github_token or GITHUB_TOKEN
    if not token:
        raise ValueError("GitHub token not provided and GITHUB_TOKEN environment variable not set")

    url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}/files"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    diff = {}
    async with httpx.AsyncClient(timeout=30) as client:
        page = 1
        while True:
            resp = await client.get(url, headers=headers, params={"page": page, "per_page": 100})
            resp.raise_for_status()
            files = resp.json()

            if not files:
                break

            for file in files:
                diff[file["filename"]] = file.get("patch", "")

            page += 1

    return diff


if __name__ == "__main__":
    import asyncio

    async def main():
        d = await get_pr_diff_async("Neurade", "repo_test", 6)
        pprint.pprint(d)

    asyncio.run(main())
