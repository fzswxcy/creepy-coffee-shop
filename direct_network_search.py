#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime

# 创建一个简单的网络搜索函数
def test_network_connectivity():
    print("测试网络连接...")
    
    test_urls = [
        "https://www.baidu.com",
        "https://www.google.com",
        "https://www.bing.com",
        "https://github.com"
    ]
    
    for url in test_urls:
        try:
            response = requests.get(url, timeout=5)
            print(f"✓ {url}: 状态码 {response.status_code}")
        except Exception as e:
            print(f"✗ {url}: 连接失败 - {str(e)}")
    
    print("\n")

def search_openclaw_references():
    print("搜索OpenClaw相关引用...")
    print("="*80)
    
    # 定义搜索词
    search_terms = [
        ("腾讯", "腾讯 openclaw"),
        ("阿里", "阿里 openclaw"),
        ("百度", "百度 openclaw"),
        ("华为", "华为 openclaw"),
        ("字节跳动", "字节跳动 openclaw")
    ]
    
    results = {}
    
    for company, term in search_terms:
        print(f"\n搜索: {company} - '{term}'")
        
        # 使用DuckDuckGo的API（非官方，但可以获取结果）
        try:
            ddg_url = f"https://api.duckduckgo.com/?q={requests.utils.quote(term)}&format=json&pretty=1"
            response = requests.get(ddg_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                company_results = {
                    "company": company,
                    "search_term": term,
                    "abstract": data.get('Abstract', '无摘要'),
                    "abstract_source": data.get('AbstractSource', '未知来源'),
                    "abstract_url": data.get('AbstractURL', ''),
                    "related_topics": [],
                    "results": []
                }
                
                # 提取相关主题
                for topic in data.get('RelatedTopics', [])[:5]:
                    if 'Text' in topic:
                        company_results['related_topics'].append(topic['Text'])
                    if 'FirstURL' in topic:
                        company_results['results'].append({
                            "title": topic.get('Text', '无标题'),
                            "url": topic['FirstURL']
                        })
                
                results[company] = company_results
                print(f"  找到 {len(company_results['results'])} 个相关结果")
                
            else:
                print(f"  API请求失败: 状态码 {response.status_code}")
                results[company] = {
                    "company": company,
                    "search_term": term,
                    "error": f"API请求失败: 状态码 {response.status_code}"
                }
                
        except Exception as e:
            print(f"  搜索异常: {str(e)}")
            results[company] = {
                "company": company,
                "search_term": term,
                "error": f"搜索异常: {str(e)}"
            }
        
        time.sleep(2)  # 避免请求过快
    
    return results

def search_github_openclaw():
    print("\n搜索GitHub上的OpenClaw相关项目...")
    print("-"*80)
    
    github_results = {}
    
    # 搜索GitHub API
    try:
        # OpenClaw官方仓库
        github_urls = [
            "https://api.github.com/repos/openclaw/openclaw",
            "https://api.github.com/search/repositories?q=openclaw"
        ]
        
        for url in github_urls:
            try:
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'items' in data:  # 搜索API
                        for item in data['items'][:5]:
                            repo_name = item.get('full_name', '')
                            description = item.get('description', '')
                            stars = item.get('stargazers_count', 0)
                            url = item.get('html_url', '')
                            
                            if 'openclaw' in repo_name.lower():
                                github_results[repo_name] = {
                                    "description": description,
                                    "stars": stars,
                                    "url": url,
                                    "type": "github_repository"
                                }
                                print(f"  ✓ {repo_name}: {description[:50]}...")
                    
                    elif 'name' in data:  # 单个仓库
                        github_results[data['name']] = {
                            "description": data.get('description', ''),
                            "stars": data.get('stargazers_count', 0),
                            "url": data.get('html_url', ''),
                            "type": "official_repository"
                        }
                        print(f"  ✓ 官方仓库: {data['name']}")
                
                time.sleep(1)
                
            except Exception as e:
                print(f"  GitHub请求异常: {str(e)}")
    
    except Exception as e:
        print(f"  GitHub搜索异常: {str(e)}")
    
    return github_results

def generate_final_report(company_results, github_results):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 生成JSON报告
    report = {
        "search_time": datetime.now().isoformat(),
        "search_method": "HTTP API请求 + DuckDuckGo API + GitHub API",
        "companies_searched": len(company_results),
        "company_results": company_results,
        "github_projects": github_results,
        "summary": {
            "total_companies": len(company_results),
            "companies_with_results": sum(1 for r in company_results.values() if 'results' in r and len(r['results']) > 0),
            "total_github_projects": len(github_results)
        }
    }
    
    # 保存JSON
    json_file = f"openclaw_network_search_{timestamp}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成文本报告
    txt_file = f"openclaw_network_report_{timestamp}.txt"
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("OpenClaw网络搜索验证报告\n")
        f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("一、网络连接测试\n")
        f.write("   已完成多种网络服务连接测试\n\n")
        
        f.write("二、公司相关搜索\n")
        f.write("=" * 60 + "\n")
        
        total_company_results = 0
        for company, result in company_results.items():
            f.write(f"\n{company}:\n")
            f.write(f"  搜索词: {result.get('search_term', '未知')}\n")
            
            if 'error' in result:
                f.write(f"  状态: {result['error']}\n")
            else:
                abstract = result.get('abstract', '')
                if abstract and abstract != '无摘要':
                    f.write(f"  摘要: {abstract[:200]}...\n")
                
                results = result.get('results', [])
                if results:
                    f.write(f"  找到 {len(results)} 个相关结果:\n")
                    for i, res in enumerate(results[:3], 1):
                        f.write(f"    {i}. {res.get('title', '无标题')}\n")
                        f.write(f"       链接: {res.get('url', '无链接')}\n")
                    total_company_results += len(results)
                else:
                    f.write("  未找到明确的相关结果\n")
        
        f.write("\n" + "=" * 60 + "\n")
        f.write("三、GitHub项目搜索\n")
        f.write("=" * 60 + "\n")
        
        if github_results:
            f.write(f"找到 {len(github_results)} 个相关项目:\n\n")
            for repo_name, info in github_results.items():
                f.write(f"• {repo_name}\n")
                f.write(f"  描述: {info.get('description', '无描述')}\n")
                f.write(f"  Stars: {info.get('stars', 0)}\n")
                f.write(f"  链接: {info.get('url', '')}\n\n")
        else:
            f.write("未找到GitHub上的相关项目\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("搜索总结\n")
        f.write("=" * 80 + "\n")
        f.write(f"搜索时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"搜索公司数量: {len(company_results)} 家\n")
        f.write(f"找到公司结果数量: {total_company_results} 条\n")
        f.write(f"找到GitHub项目: {len(github_results)} 个\n")
        f.write("搜索方法: HTTP API请求（DuckDuckGo + GitHub）\n")
        f.write("验证方式: 真实网络请求，非模拟\n")
        
        f.write("\n结论:\n")
        f.write("1. 已使用真实网络请求进行搜索验证\n")
        f.write("2. 搜索范围覆盖中国主要科技公司\n")
        f.write("3. 通过API获取结构化搜索结果\n")
        f.write("4. 包含GitHub项目信息\n")
        f.write("5. 所有数据均来自实时网络请求\n")
    
    print(f"\n报告生成完成:")
    print(f"  JSON报告: {json_file}")
    print(f"  文本报告: {txt_file}")
    
    # 打印简要结果
    print("\n" + "=" * 80)
    print("搜索完成!")
    print("=" * 80)
    print(f"总计搜索公司: {len(company_results)}")
    print(f"找到相关结果的公司: {report['summary']['companies_with_results']}")
    print(f"GitHub相关项目: {len(github_results)}")

def main():
    print("开始OpenClaw网络搜索验证")
    print("="*80)
    
    # 测试网络连接
    test_network_connectivity()
    
    # 搜索公司相关信息
    company_results = search_openclaw_references()
    
    # 搜索GitHub项目
    github_results = search_github_openclaw()
    
    # 生成最终报告
    generate_final_report(company_results, github_results)

if __name__ == "__main__":
    main()