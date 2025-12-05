import base64
from email.mime.text import MIMEText
from typing import Dict, Any, List
from collections import defaultdict


def gmail_list_recent(gmail,max_results: int = 5)-> str:
    """ 
    List the most recent emails in the user's inbox.
    """
    
    results = (
        gmail.users().messages().list(userId="me",labelIds=["INBOX"],maxResults=max_results).execute()
    )
    
    messages: List[Dict[str, Any]] = results.get("messages", [])
    if not messages:
        return "No emails found in inbox."
    
    summaries = []
    for msg_meta in messages:
        msg = (
            gmail.users().messages().get(userId="me", id=msg_meta["id"],format="metadata",metadataHeaders=["Subject","From","Date"]).execute()
            
        )
        headers = {h["name"]: h["value"] for h in msg.get("payload",{}).get("headers",[])}
        subject = headers.get("Subject", "(no subject)")
        sender = headers.get("From", "(unknown sender)")
        date = headers.get("Date", "(no date)")
        
        summaries.append(f" - From: {sender}\n subject: {subject}\n Date:{date}")
    return "Here are the most recent emails in your inbox:\n" + "\n".join(summaries)
    

def gmail_search(gmail,query: str, max_results: int = 10)-> str:
    """ 
    Search emails using GMAIL query syntax
    """
    
    results = (
        gmail.users().messages().list(userId="me",q=query,maxResults=max_results).execute()
    )
    messages: List[Dict[str, Any]] = results.get("messages", [])
    if not messages:
        return "No emails found matching the query."
    
    summaries = []
    for msg_meta in messages:
        msg = (
            gmail.users()
            .messages()
            .get(userId="me", id=msg_meta["id"], format="metadata", metadataHeaders=["Subject", "From", "Date"])
            .execute()
        )

        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        subject = headers.get("Subject", "(no subject)")
        sender = headers.get("From", "(unknown sender)")
        date = headers.get("Date", "(no date)")

        summaries.append(f"- From: **{sender}**\n  Subject: {subject}\n  Date: {date}")
    return f"## Search Results\n\nSearch query: `{query}`\n\n" + "\n\n".join(summaries)

def gmail_create_draft(gmail, to: str, subject: str, body: str) -> str:
    """ 
    Create a draft email using Gmail API (user can review and send manually)
    """
    mime_message = MIMEText(body)
    mime_message["to"] = to
    mime_message["subject"] = subject
    
    raw_bytes = base64.urlsafe_b64encode(mime_message.as_bytes())
    raw_str = raw_bytes.decode()
    
    message = {"message": {"raw": raw_str}}
    
    draft = (
        gmail.users().drafts().create(userId="me", body=message).execute()
    )
    
    draft_id = draft.get("id", "(unknown-id)")
    return f"✅ Draft created successfully!\n\nTo: {to}\nSubject: {subject}\n\nThe draft has been saved to your Gmail Drafts folder. Please open Gmail to review and send it."


def gmail_top_emails(gmail, max_results: int = 10) -> str:
    """
    Get top emails by frequency (how many times the same email appears).
    Groups emails by subject and sender, then sorts by count.
    """
    try:
        # Get messages from inbox (limit to reasonable number for performance)
        results = (
            gmail.users().messages().list(userId="me", labelIds=["INBOX"], maxResults=100).execute()
        )
        
        messages: List[Dict[str, Any]] = results.get("messages", [])
        if not messages:
            return "No emails found in inbox."
        
        # Count frequency of each email (by subject + sender)
        email_counts = defaultdict(int)
        email_details = {}
        
        for msg_meta in messages:
            msg = (
                gmail.users().messages().get(
                    userId="me", 
                    id=msg_meta["id"],
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"]
                ).execute()
            )
            
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            subject = headers.get("Subject", "(no subject)")
            sender = headers.get("From", "(unknown sender)")
            date = headers.get("Date", "(no date)")
            
            # Use subject + sender as key for grouping
            key = (subject, sender)
            email_counts[key] += 1
            
            # Store details for the first occurrence
            if key not in email_details:
                email_details[key] = {
                    "subject": subject,
                    "sender": sender,
                    "date": date
                }
        
        # Sort by count (descending) and take top N
        top_emails = sorted(
            email_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:max_results]
        
        # Format results
        summaries = []
        for i, ((subject, sender), count) in enumerate(top_emails, 1):
            details = email_details[(subject, sender)]
            summaries.append(
                f"{i}. Subject: {details['subject']}\n"
                f"   From: {details['sender']}\n"
                f"   Date: {details['date']}\n"
                f"   Count: {count} occurrence(s)"
            )
        
        return f"## Top {len(summaries)} Emails by Frequency:\n\n" + "\n\n".join(summaries)
        
    except Exception as e:
        return f"Error retrieving top emails: {str(e)}"

def gmail_analysis_summary(gmail) -> str:
    """ 
    Generate a comprehensive email analysis summary with proper formatting.
    """
    
    # Get data for analysis
    top_emails = gmail_top_emails(gmail, 10)
    recent_emails = gmail_list_recent(gmail, 10)
    
    # Parse the top emails data to extract insights
    insights = analyze_email_patterns(gmail)
    
    summary = "# Email Analysis Summary\n\n"
    summary += "Based on the tools used, the following key findings and specific details were gathered:\n\n"
    summary += top_emails + "\n\n"
    summary += recent_emails + "\n\n"
    
    # Add dynamic key takeaways and recommendations
    summary += "## Key Takeaways\n\n"
    summary += insights["takeaways"] + "\n\n"
    
    summary += "## Recommendations\n\n"
    summary += insights["recommendations"] + "\n\n"
    
    summary += "## Conclusion\n\n"
    summary += "The analysis provided a comprehensive overview of the user's email inbox, highlighting the types of emails received, the most frequent senders, and specific details about recent emails. This information can be used to inform email management strategies and improve the overall email experience."
    
    return summary


def analyze_email_patterns(gmail) -> Dict[str, str]:
    """
    Analyze email patterns and generate dynamic insights.
    Returns a dict with 'takeaways' and 'recommendations' keys.
    """
    try:
        # Get more emails for better analysis (increase from 100 to 200)
        results = gmail.users().messages().list(userId="me", labelIds=["INBOX"], maxResults=200).execute()
        messages = results.get("messages", [])
        
        if not messages:
            return {
                "takeaways": "- No emails found in the inbox for analysis",
                "recommendations": "- Check your Gmail connection\n- Ensure you have emails in your inbox"
            }
        
        # Collect email data
        senders = []
        subjects = []
        email_types = {"promotional": 0, "transactional": 0, "personal": 0, "newsletter": 0, "other": 0}
        
        for msg_meta in messages[:50]:  # Analyze first 50 for performance
            msg = gmail.users().messages().get(
                userId="me", 
                id=msg_meta["id"],
                format="metadata",
                metadataHeaders=["Subject", "From", "Date"]
            ).execute()
            
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            subject = headers.get("Subject", "").lower()
            sender = headers.get("From", "").lower()
            
            senders.append(sender)
            subjects.append(subject)
            
            # Categorize email types
            if any(keyword in subject for keyword in ["sale", "deal", "offer", "discount", "promotion", "free", "buy now"]):
                email_types["promotional"] += 1
            elif any(keyword in sender for keyword in ["noreply", "no-reply", "donotreply", "bank", "payment", "receipt", "order"]):
                email_types["transactional"] += 1
            elif any(keyword in subject for keyword in ["newsletter", "update", "digest", "weekly", "monthly"]):
                email_types["newsletter"] += 1
            elif sender.endswith("@gmail.com") or sender.endswith("@yahoo.com") or sender.endswith("@outlook.com"):
                email_types["personal"] += 1
            else:
                email_types["other"] += 1
        
        # Find most frequent senders
        sender_counts = defaultdict(int)
        for sender in senders:
            # Extract domain for grouping
            if "@" in sender:
                domain = sender.split("@")[-1].split(">")[0]
                sender_counts[domain] += 1
        
        top_senders = sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Generate dynamic takeaways
        takeaways = []
        
        # Most common email type
        dominant_type = max(email_types.items(), key=lambda x: x[1])
        if dominant_type[1] > 0:
            takeaways.append(f"- The majority of emails appear to be {dominant_type[0]} in nature ({dominant_type[1]} out of {sum(email_types.values())} analyzed)")
        
        # Top senders
        if top_senders:
            sender_list = [f"{domain} ({count})" for domain, count in top_senders]
            takeaways.append(f"- Most frequent senders by domain: {', '.join(sender_list)}")
        
        # Email volume insight
        total_emails = len(messages)
        takeaways.append(f"- Total emails analyzed: {total_emails}")
        
        # Subject patterns
        if subjects:
            short_subjects = sum(1 for s in subjects if len(s.strip()) < 20)
            long_subjects = sum(1 for s in subjects if len(s.strip()) > 50)
            takeaways.append(f"- Email subjects: {short_subjects} short (<20 chars), {long_subjects} long (>50 chars)")
        
        # Generate recommendations
        recommendations = []
        
        # Based on email types
        if email_types["promotional"] > email_types["personal"] * 2:
            recommendations.append("- Consider unsubscribing from promotional emails that are not of interest")
        
        if email_types["newsletter"] > 5:
            recommendations.append("- Review newsletter subscriptions and unsubscribe from those you no longer read")
        
        # General recommendations
        recommendations.append("- Be cautious when clicking on links from unfamiliar senders")
        recommendations.append("- Regularly clean out the inbox to maintain a clutter-free email experience")
        
        if len(senders) > 20:
            recommendations.append("- Consider setting up email filters for frequent senders")
        
        return {
            "takeaways": "\n".join(takeaways),
            "recommendations": "\n".join(recommendations)
        }
        
    except Exception as e:
        return {
            "takeaways": f"- Error analyzing email patterns: {str(e)}",
            "recommendations": "- Check your Gmail connection and try again"
        }
    
    